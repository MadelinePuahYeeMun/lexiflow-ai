from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

# Temporary in-memory audit log
audit_logs = []

class AnalyzeInput(BaseModel):
    input: str

@app.get("/")
def home():
    return {"message": "LexiFlow AI Backend Running"}

@app.post("/analyze")
def analyze(data: AnalyzeInput):
    text = data.input.lower()

    # Simple detection logic
    personal_data_keywords = ["name", "phone", "email", "ic", "address", "customer list"]
    external_sharing_keywords = ["share", "send", "partner", "third party", "external", "marketing"]
    consent_keywords = ["consent", "permission", "approved by user"]

    has_personal_data = any(word in text for word in personal_data_keywords)
    has_external_sharing = any(word in text for word in external_sharing_keywords)
    has_consent = any(word in text for word in consent_keywords)

    # Decision logic
    if has_personal_data and has_external_sharing and not has_consent:
        status = "blocked"
        risk_level = "high"
        risk_score = 87
        reason = "Personal data is being shared externally without consent."
        suggestion = "Obtain explicit consent or anonymize the data before sharing."
    elif has_personal_data and has_external_sharing and has_consent:
        status = "escalate"
        risk_level = "medium"
        risk_score = 60
        reason = "Personal data is being shared externally, but consent is mentioned."
        suggestion = "Send to compliance officer for review before proceeding."
    elif has_personal_data:
        status = "approve"
        risk_level = "low"
        risk_score = 20
        reason = "Personal data detected, but no risky external sharing found."
        suggestion = "Proceed with caution and follow internal data handling policy."
    else:
        status = "approve"
        risk_level = "low"
        risk_score = 5
        reason = "No personal data or compliance risk detected."
        suggestion = "No further action required."

    result = {
        "status": status,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "reason": reason,
        "suggestion": suggestion,
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
