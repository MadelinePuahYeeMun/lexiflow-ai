import os
import json
import re
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI

app = FastAPI(title="LexiFlow AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # development stage
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary in-memory audit log
audit_logs = []

# Environment config
ILMU_API_KEY = os.getenv("ILMU_API_KEY", "")
USE_GLM = os.getenv("USE_GLM", "false").lower() == "true"
ILMU_MODEL = "ilmu-glm-5.1"

client = None
if ILMU_API_KEY:
    client = OpenAI(
        api_key=ILMU_API_KEY,
        base_url="https://api.ilmu.ai/v1",
    )


class AnalyzeInput(BaseModel):
    input: str
    source_type: Optional[str] = "manual_input"
    trigger_mode: Optional[str] = "manual_scan"
    session_id: Optional[str] = None


@app.get("/")
def home():
    return {"message": "LexiFlow AI Backend Running - VERSION 6"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "glm_enabled": USE_GLM,
        "glm_ready": client is not None
    }


def build_timestamp() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def save_or_update_audit_log(
    data: AnalyzeInput,
    status: str,
    risk_level: str,
    risk_score: int,
    recommended_action: str,
    timestamp: str,
):
    log_entry = {
        "input": data.input,
        "source_type": data.source_type,
        "trigger_mode": data.trigger_mode,
        "session_id": data.session_id,
        "status": status,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "recommended_action": recommended_action,
        "timestamp": timestamp
    }

    if data.session_id:
        existing_index = next(
            (i for i, log in enumerate(audit_logs) if log.get("session_id") == data.session_id),
            None
        )
        if existing_index is not None:
            audit_logs[existing_index] = log_entry
        else:
            audit_logs.append(log_entry)
    else:
        audit_logs.append(log_entry)


def rule_based_analyze(data: AnalyzeInput) -> dict:
    text = data.input.lower()

    personal_data_keywords = [
        "name", "names", "phone", "phone number", "email", "emails",
        "ic", "address", "customer list"
    ]
    external_sharing_keywords = [
        "share", "send", "partner", "third party", "external", "marketing"
    ]
    consent_keywords = [
        "consent", "permission", "approved by user", "user consent"
    ]

    detected_entities: List[str] = []

    if any(word in text for word in ["name", "names"]):
        detected_entities.append("names")
    if any(word in text for word in ["phone", "phone number"]):
        detected_entities.append("phone numbers")
    if any(word in text for word in ["email", "emails"]):
        detected_entities.append("email addresses")
    if "ic" in text:
        detected_entities.append("IC numbers")
    if "address" in text:
        detected_entities.append("addresses")
    if "customer list" in text:
        detected_entities.append("customer list")

    has_personal_data = any(word in text for word in personal_data_keywords)
    has_external_sharing = any(word in text for word in external_sharing_keywords)
    has_consent = any(word in text for word in consent_keywords)

    reasoning_steps: List[str] = []

    if has_personal_data:
        reasoning_steps.append("Detected personal data in the input.")
    else:
        reasoning_steps.append("No personal data detected.")

    if has_external_sharing:
        reasoning_steps.append("Detected possible external sharing activity.")
    else:
        reasoning_steps.append("No external sharing activity detected.")

    if has_consent:
        reasoning_steps.append("Consent or permission is mentioned.")
    else:
        reasoning_steps.append("No consent or permission detected.")

    if has_personal_data and has_external_sharing and not has_consent:
        status = "blocked"
        risk_level = "high"
        risk_score = 87
        reason = "Personal data is being shared externally without consent."
        compliance_basis = "PDPA - external sharing of personal data requires valid consent."
        suggestion = "Remove personal data, anonymize the content, or obtain explicit consent before sending."
        recommended_action = "show_warning"
        reasoning_steps.append("High-risk PDPA violation identified. Warning should be triggered.")
    elif has_personal_data and has_external_sharing and has_consent:
        status = "escalate"
        risk_level = "medium"
        risk_score = 60
        reason = "Personal data is being shared externally, and consent is mentioned."
        compliance_basis = "PDPA - external sharing with consent may still require compliance review."
        suggestion = "Escalate to compliance officer or review before proceeding."
        recommended_action = "show_warning"
        reasoning_steps.append("Medium-risk case identified. Human review is recommended.")
    elif has_personal_data:
        status = "approve"
        risk_level = "low"
        risk_score = 20
        reason = "Personal data is present, but no risky external sharing is detected."
        compliance_basis = "PDPA - personal data handling appears internal and low risk."
        suggestion = "Proceed with caution and follow internal data handling policy."
        recommended_action = "allow"
        reasoning_steps.append("Low-risk internal handling detected. Action may proceed.")
    else:
        status = "approve"
        risk_level = "low"
        risk_score = 5
        reason = "No personal data or compliance risk detected."
        compliance_basis = "No PDPA-sensitive activity detected."
        suggestion = "No further action required."
        recommended_action = "allow"
        reasoning_steps.append("No significant compliance risk found.")

    return {
        "status": status,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "reason": reason,
        "suggestion": suggestion,
        "detected_entities": detected_entities,
        "compliance_basis": compliance_basis,
        "reasoning_steps": reasoning_steps,
        "recommended_action": recommended_action,
    }


def extract_json_object(text: str) -> dict:
    """
    Try to extract the first JSON object from model output.
    """
    text = text.strip()

    # Try direct JSON parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Fallback: extract {...}
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError("Could not parse valid JSON from model response.")


def glm_analyze(data: AnalyzeInput) -> dict:
    if client is None:
        raise RuntimeError("ILMU client not configured.")

    system_prompt = """
You are LexiFlow AI, a compliance reasoning engine for PDPA-style privacy review.

Analyze the given text and return ONLY valid JSON.
Do not return markdown.
Do not return explanations outside JSON.

Required JSON fields:
- status: one of ["approve", "blocked", "escalate"]
- risk_level: one of ["low", "medium", "high"]
- risk_score: integer between 0 and 100
- reason: short string
- suggestion: short string
- detected_entities: array of strings
- compliance_basis: short string
- reasoning_steps: array of short strings
- recommended_action: one of ["allow", "show_warning"]

Guidelines:
- If risky external sharing of personal data occurs without consent, return blocked/high/show_warning.
- If external sharing exists and consent is mentioned, return escalate/medium/show_warning.
- If only low-risk internal handling exists, return approve/low/allow.
- If no privacy/compliance risk is found, return approve/low/allow.
"""

    user_prompt = f"""
Source type: {data.source_type}
Trigger mode: {data.trigger_mode}

Text:
{data.input}
"""

    response = client.chat.completions.create(
        model=ILMU_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0,
    )

    content = response.choices[0].message.content
    parsed = extract_json_object(content)

    # Normalize and validate minimum fields
    result = {
        "status": parsed.get("status", "escalate"),
        "risk_level": parsed.get("risk_level", "medium"),
        "risk_score": int(parsed.get("risk_score", 50)),
        "reason": parsed.get("reason", "Model analysis completed."),
        "suggestion": parsed.get("suggestion", "Please review the content before proceeding."),
        "detected_entities": parsed.get("detected_entities", []),
        "compliance_basis": parsed.get("compliance_basis", "PDPA-based compliance analysis."),
        "reasoning_steps": parsed.get("reasoning_steps", ["Model-generated reasoning completed."]),
        "recommended_action": parsed.get("recommended_action", "show_warning"),
    }

    # Safety normalization
    if result["status"] not in ["approve", "blocked", "escalate"]:
        result["status"] = "escalate"
    if result["risk_level"] not in ["low", "medium", "high"]:
        result["risk_level"] = "medium"
    if result["recommended_action"] not in ["allow", "show_warning"]:
        result["recommended_action"] = "show_warning"

    return result


@app.post("/analyze")
def analyze(data: AnalyzeInput):
    timestamp = build_timestamp()

    # Try GLM first if enabled, otherwise fallback to rule-based
    try:
        if USE_GLM:
            analysis = glm_analyze(data)
        else:
            analysis = rule_based_analyze(data)
    except Exception as e:
        analysis = rule_based_analyze(data)
        analysis["reasoning_steps"].append(f"Fallback triggered due to GLM error: {str(e)}")

    result = {
        "status": analysis["status"],
        "risk_level": analysis["risk_level"],
        "risk_score": analysis["risk_score"],
        "reason": analysis["reason"],
        "suggestion": analysis["suggestion"],
        "detected_entities": analysis["detected_entities"],
        "compliance_basis": analysis["compliance_basis"],
        "reasoning_steps": analysis["reasoning_steps"],
        "recommended_action": analysis["recommended_action"],
        "source_type": data.source_type,
        "trigger_mode": data.trigger_mode,
        "session_id": data.session_id,
        "timestamp": timestamp
    }

    save_or_update_audit_log(
        data=data,
        status=result["status"],
        risk_level=result["risk_level"],
        risk_score=result["risk_score"],
        recommended_action=result["recommended_action"],
        timestamp=timestamp,
    )

    return result


@app.get("/audit-log")
def get_audit_log():
    return {"logs": audit_logs}


@app.get("/risk-score")
def get_risk_score_preview():
    return {
        "message": "Risk score is currently generated through /analyze response.",
        "note": "A dedicated /risk-score endpoint can be expanded in future versions."
    }