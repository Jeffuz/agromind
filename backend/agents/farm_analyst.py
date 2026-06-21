"""
AgroMind Farm Analyst — Fetch.ai uAgent
========================================
Run as a standalone process alongside the main FastAPI backend:

    # terminal 1
    uvicorn main:app --port 8000

    # terminal 2
    python -m agents.farm_analyst

The agent serves two interfaces:
  - Port 8001  uAgent protocol  — other Fetch.ai agents can send FarmAnalysisRequest messages
  - Port 8002  REST companion   — FastAPI calls POST /analyze (HTTP, no signing required)

Register on Agentverse by setting AGENTVERSE_API_KEY in your .env.
"""

import json
import os
import sys
from pathlib import Path

# Allow running as `python -m agents.farm_analyst` from the backend directory
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from openai import AsyncOpenAI

load_dotenv()
from pydantic import BaseModel
from uagents import Agent, Context

from agents.models import FarmAnalysisRequest, FarmAnalysisResponse

# ---------------------------------------------------------------------------
# Fetch.ai uAgent
# ---------------------------------------------------------------------------

AGENT_SEED = os.getenv("FARM_ANALYST_SEED", "agromind-farm-analyst-v1-seed-phrase")

farm_analyst = Agent(
    name="farm_analyst",
    seed=AGENT_SEED,
    port=8001,
    endpoint=["http://localhost:8001/submit"],
)


@farm_analyst.on_event("startup")
async def on_startup(ctx: Context) -> None:
    ctx.logger.info(f"farm_analyst online | address: {farm_analyst.address}")


@farm_analyst.on_message(model=FarmAnalysisRequest)
async def handle_analysis_request(
    ctx: Context, sender: str, msg: FarmAnalysisRequest
) -> None:
    """Handle requests from other Fetch.ai agents."""
    ctx.logger.info(f"analysis request {msg.request_id} from {sender}")
    try:
        _reasoning, analysis = await _call_nemotron(
            msg.grid_text, msg.stats, msg.high_risk_coords
        )
        await ctx.send(
            sender,
            FarmAnalysisResponse(request_id=msg.request_id, analysis=analysis),
        )
    except Exception as exc:
        await ctx.send(
            sender,
            FarmAnalysisResponse(
                request_id=msg.request_id, analysis={}, error=str(exc)
            ),
        )


# ---------------------------------------------------------------------------
# REST companion API — FastAPI calls this instead of calling Nemotron directly
# ---------------------------------------------------------------------------

companion = FastAPI(title="AgroMind Farm Analyst Agent", version="0.1.0")


class AnalyzeRequest(BaseModel):
    grid_text: str
    stats: dict
    high_risk_coords: list


@companion.get("/health")
async def health() -> dict:
    return {"status": "ok", "agent_address": farm_analyst.address}


@companion.post("/analyze")
async def analyze(req: AnalyzeRequest) -> dict:
    api_key = os.environ.get("NVIDIA_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="NVIDIA_API_KEY not set")
    try:
        reasoning, analysis = await _call_nemotron(
            req.grid_text, req.stats, req.high_risk_coords
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {"reasoning": reasoning, "analysis": analysis, "agent_address": farm_analyst.address}


# ---------------------------------------------------------------------------
# Nemotron helpers
# ---------------------------------------------------------------------------

async def _call_nemotron(
    grid_text: str, stats: dict, high_risk_coords: list
) -> tuple[str, dict]:
    """Returns (reasoning, analysis) where reasoning is the CoT text before ANALYSIS:."""
    client = AsyncOpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.environ["NVIDIA_API_KEY"],
    )
    prompt = _build_prompt(grid_text, stats, high_risk_coords)
    response = await client.chat.completions.create(
        model="nvidia/llama-3.1-nemotron-nano-8b-v1",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}],
    )
    full_text = response.choices[0].message.content
    if "ANALYSIS:" in full_text:
        reasoning = full_text.split("ANALYSIS:", 1)[0].strip()
    else:
        reasoning = ""
    analysis = _extract_analysis(full_text)
    return reasoning, analysis


def _build_prompt(grid_text: str, stats: dict, high_risk_coords: list) -> str:
    cap = high_risk_coords[:10]
    ellipsis = "..." if len(high_risk_coords) > 10 else ""
    total = stats.get("total", stats.get("visited", 0) + stats.get("unvisited", 0))
    return f"""You are an agricultural AI assistant. A farm robot has scanned {stats.get("visited", 0)}/{total} plants.

SCAN RESULTS:
- High risk (>0.6): {stats.get("high_risk", 0)} plants at {cap}{ellipsis}
- Medium risk (0.3-0.6): {stats.get("medium_risk", 0)} plants
- Healthy (<0.3): {stats.get("healthy", 0)} plants
- Unvisited: {stats.get("unvisited", 0)} plants

{grid_text}

Reply with ONLY this JSON, no other text:
{{"overview":"2-3 sentence farm summary","high_risk_areas":"where disease clusters are","healthy_areas":"where plants are healthy","unvisited_areas":"what remains unscanned","recommendations":"specific action plan for the farmer"}}"""


def _extract_analysis(full_text: str) -> dict:
    raw = full_text.split("ANALYSIS:", 1)[1].strip() if "ANALYSIS:" in full_text else full_text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip()
    try:
        return json.loads(raw)
    except Exception:
        start, end = raw.rfind("{"), raw.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(raw[start:end])
            except Exception:
                pass
    return {
        "overview": full_text,
        "high_risk_areas": "",
        "healthy_areas": "",
        "unvisited_areas": "",
        "recommendations": "",
    }


# ---------------------------------------------------------------------------
# Entry point — uAgent owns the main loop; companion REST runs in a thread
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import threading
    t = threading.Thread(
        target=uvicorn.run,
        kwargs={"app": companion, "host": "0.0.0.0", "port": 8002, "log_level": "info"},
        daemon=True,
    )
    t.start()
    farm_analyst.run()
