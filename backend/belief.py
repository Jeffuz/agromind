"""Small, explicit bridge between CV perception and planner state."""

DEFAULT_PRIOR_RISK = 0.30


def update_belief(
    severity: float,
    confidence: float,
    prior_risk: float = DEFAULT_PRIOR_RISK,
) -> tuple[float, float]:
    """Blend a CV risk proxy with the unknown-plant prior.

    This is an MVP heuristic rather than a calibrated Bayesian update. A
    confident prediction approaches its disease risk proxy; an uncertain one
    stays closer to the prior.
    """
    for name, value in {
        "severity": severity,
        "confidence": confidence,
        "prior_risk": prior_risk,
    }.items():
        if not 0.0 <= value <= 1.0:
            raise ValueError(f"{name} must be between 0 and 1.")

    uncertainty = 1.0 - confidence
    belief_risk = severity * confidence + prior_risk * uncertainty
    return round(belief_risk, 4), round(uncertainty, 4)

