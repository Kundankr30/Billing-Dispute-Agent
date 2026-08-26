from typing import Literal
from pydantic import BaseModel, Field


class GeneratedEmail(BaseModel):
    subject: str = Field(..., description="Email subject line")
    body_plain: str = Field(..., description="Plain-text version of the email body")
    body_html: str = Field(..., description="HTML version of the email body")
    escalation_level: Literal[
        "initial_dispute",
        "followup_1",
        "followup_2",
        "final_escalation",
    ] = Field(..., description="Which stage this email corresponds to")