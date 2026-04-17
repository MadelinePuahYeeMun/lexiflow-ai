from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(title="LexiFlow AI Backend")

# Temporary in-memory audit log
audit_logs = []

class AnalyzeInput(BaseModel):
    input: str

@app.get("/")
def home():
    return {"message": "LexiFlow AI Backend Running - VERSION 3"}

@app.post("/analyze")
def analyze(data: AnalyzeInput):
    text = data.input.lower()

    # Keyword sets
    personal_data_keywords = ["name", "names", "phone", "phone number", "email", "emails", "ic", "address", "customer list"]
    external_sharing_keywords = ["share", "send", "partner", "third party", "external", "marketing"]
    consent_keywords = ["consent", "permission", "approved by user", "user consent"]

    # Detection
    detected_entities = []

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

    reasoning_steps = []

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

    # Decision logic
    if has_personal_data and has_external_sharing and not has_consent:
        status = "blocked"
        risk_level = "high"
        risk_score = 87
        reason = "Personal data is being shared externally without consent."
        compliance_basis = "PDPA - external sharing of personal data requires valid consent."
        suggestion = "Obtain explicit consent or anonymize the data before sharing."
        reasoning_steps.append("High-risk PDPA violation identified. Action should be blocked.")
    elif has_personal_data and has_external_sharing and has_consent:
        status = "escalate"
        risk_level = "medium"
        risk_score = 60
        reason = "Personal data is being shared externally, and consent is mentioned."
        compliance_basis = "PDPA - external sharing with consent may still require compliance review."
        suggestion = "Escalate to compliance officer for validation before proceeding."
        reasoning_steps.append("Medium-risk case identified. Human review is recommended.")
    elif has_personal_data:
        status = "approve"
        risk_level = "low"
        risk_score = 20
        reason = "Personal data is present, but no risky external sharing is detected."
        compliance_basis = "PDPA - personal data handling appears internal and low risk."
        suggestion = "Proceed with caution and follow internal data handling policy."
        reasoning_steps.append("Low-risk internal handling detected. Action may proceed.")
    else:
        status = "approve"
        risk_level = "low"
        risk_score = 5
        reason = "No personal data or compliance risk detected."
        compliance_basis = "No PDPA-sensitive activity detected."
        suggestion = "No further action required."
        reasoning_steps.append("No significant compliance risk found.")

    result = {
        "status": status,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "reason": reason,
        "suggestion": suggestion,
        "detected_entities": detected_entities,
        "compliance_basis": compliance_basis,
        "reasoning_steps": reasoning_steps,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    # Save to audit log
    audit_logs.append({
        "input": data.input,
        "status": status,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "timestamp": result["timestamp"]
    })

    return result

@app.get("/audit-log")
def get_audit_log():
    return {"logs": audit_logs}