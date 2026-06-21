from uagents import Model


class FarmAnalysisRequest(Model):
    request_id: str
    grid_text: str
    stats: dict
    high_risk_coords: list


class FarmAnalysisResponse(Model):
    request_id: str
    analysis: dict
    error: str = ""
