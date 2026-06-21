"""Stable API contracts shared with robot and frontend clients."""

from typing import Literal

from pydantic import BaseModel, Field


DiseaseLabel = Literal["healthy", "early_blight", "late_blight", "leaf_mold"]
RobotAction = Literal["UP", "DOWN", "LEFT", "RIGHT"]


class CVPrediction(BaseModel):
    prediction: DiseaseLabel
    confidence: float = Field(ge=0.0, le=1.0)
    severity: float = Field(ge=0.0, le=1.0)
    plantId: str | None = None


class CVHealth(BaseModel):
    status: Literal["ok"]
    model: str
    classes: list[DiseaseLabel]
    inputSize: list[int]


class NextRecommendation(BaseModel):
    row: int
    col: int
    action: RobotAction
    reason: str


class ImageVisitResponse(BaseModel):
    visited: tuple[int, int]
    plantId: str
    cv: CVPrediction
    beliefRisk: float = Field(ge=0.0, le=1.0)
    uncertainty: float = Field(ge=0.0, le=1.0)
    priorRisk: float = Field(ge=0.0, le=1.0)
    alreadyVisited: bool
    nextRecommended: NextRecommendation | None
    allDone: bool

