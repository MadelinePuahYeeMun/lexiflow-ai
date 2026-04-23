# LexiFlow AI 🚀

LexiFlow AI is an AI-powered compliance monitoring system designed to help users detect and prevent potential personal data privacy violations in real time.

The system integrates with email platforms (e.g., Gmail) and uses an AI reasoning engine to analyze user-generated content before sending.

---

## 🧠 Key Features

- 🔍 Real-time content analysis
- ⚠️ Risk detection (low / medium / high)
- 🧾 Explainable AI reasoning
- 📊 Audit log tracking
- 🔌 Gmail extension integration
- 🤖 AI-powered compliance engine (ILMU-GLM-5.1)

---

## 🏗️ System Architecture

Frontend (Gmail Extension / Dashboard)  
⬇  
Backend (FastAPI)  
⬇  
ILMU GLM API (AI Reasoning Engine)  

---

## ⚙️ Tech Stack

- Backend: FastAPI (Python)
- Frontend: Web Dashboard + Gmail Extension
- AI Model: ILMU-GLM-5.1
- Deployment: Render
- Version Control: GitHub

---

## 🚀 How It Works

1. User types content (e.g., email)
2. Frontend sends content to backend `/analyze`
3. Backend calls ILMU-GLM-5.1
4. AI analyzes risk and returns structured JSON
5. Frontend displays warning / approval
6. Result is stored in audit log

---

## 📡 API Endpoints

### POST /analyze

Request:
```json
{
  "input": "string",
  "source_type": "email_page",
  "trigger_mode": "send_attempt",
  "session_id": "unique_id"
}
Response:

{
  "status": "approve | blocked | escalate",
  "risk_level": "low | medium | high",
  "risk_score": number,
  "reason": "string",
  "suggestion": "string",
  "detected_entities": ["string"],
  "compliance_basis": "string",
  "reasoning_steps": ["string"],
  "recommended_action": "allow | show_warning",
  "timestamp": "YYYY-MM-DD HH:MM:SS"
}
GET /audit-log

Returns audit history of analyzed content.

🔐 Environment Variables

Create these in your environment (or Render):

ILMU_API_KEY=your_api_key
USE_GLM=true
🧪 Running Locally
pip install -r requirements.txt
uvicorn main:app --reload

Then open:

http://127.0.0.1:8000/docs
☁️ Deployment

Backend is deployed on Render:

https://your-render-url.onrender.com
🛡️ Compliance Focus

LexiFlow AI focuses on:

Personal Data Protection (PDPA)
External data sharing risks
Consent validation
Sensitive data detection
👥 Team
Backend / AI: Madeline
Frontend: [Your teammate]
Product / PM: [Your teammate]
💡 Future Improvements
File scanning (PDF, images, spreadsheets)
OCR integration
Advanced policy customization
Multi-language support
