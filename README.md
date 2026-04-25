# LexiFlow AI 🚀

LexiFlow AI is an AI-powered compliance monitoring system designed to help users detect and prevent potential personal data privacy violations in real time.

The system integrates with browser extensions (e.g., Gmail) and uses an AI reasoning engine (ILMU-GLM-5.1) to analyze user-generated content before sending.

---

## 🧠 Key Features

* 🔍 Real-time content analysis
* ⚠️ Risk detection (low / medium / high)
* 🧾 Explainable AI reasoning (GLM-powered)
* ✨ Safe email rewrite suggestions
* 📊 Audit log tracking
* 📈 Report generation (filter by date/period)
* 🔌 Browser extension integration

---

## 🏗️ System Architecture

User (Email / Web Page)
⬇
Frontend (Extension + Dashboard)
⬇
Backend (FastAPI)
⬇
ILMU GLM API (AI Reasoning Engine)
⬇
Audit Log (In-Memory Storage)

---

## ⚙️ Tech Stack

* Backend: FastAPI (Python)
* Frontend: JavaScript (Extension + Dashboard)
* AI Model: ILMU-GLM-5.1
* Deployment: Render
* Version Control: GitHub

---

## 🚀 How It Works

1. User types content (e.g., email)
2. Extension detects input in real time
3. Frontend sends request to `/analyze`
4. Backend calls ILMU-GLM-5.1
5. AI evaluates compliance risk
6. Backend returns structured JSON
7. Frontend displays warning / approval
8. Result is stored in audit log

---
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 📡 API Endpoints

### 🔹 POST /analyze

Analyze content for compliance risk.

Request:

```json
{
  "input": "string",
  "source_type": "email_page",
  "trigger_mode": "send_attempt",
  "session_id": "unique_id"
}
```

Response:

```json
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
  "safe_email_suggestion": "string",
  "timestamp": "YYYY-MM-DD HH:MM:SS"
}
```

---

### 🔹 POST /suggest

Generate a safer rewritten version of risky content.

Request:

```json
{
  "input": "string",
  "source_type": "email_page"
}
```

Response:

```json
{
  "original_text": "string",
  "safe_version": "string",
  "timestamp": "YYYY-MM-DD HH:MM:SS"
}
```

---

### 🔹 GET /audit-log

Returns all audit history.

---

### 🔹 GET /report

Generate summary report.

Supported queries:

Preset:

```text
/report?period=today
/report?period=this_week
/report?period=this_month
/report?period=all
```

Custom range:

```text
/report?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```

Response includes:

* total_scans
* risk_summary
* decision_summary
* source_breakdown
* filtered logs

---

## 🔐 Environment Variables

Set these in your local environment or Render:

```text
ILMU_API_KEY=your_api_key
USE_GLM=true
```

---

## 🧪 Running Locally

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Open:

```text
http://127.0.0.1:8000/docs
```

---

## ☁️ Deployment

Backend is deployed on Render:

```text
https://lexiflow-ai-backend.onrender.com
```

---

## 🛡️ Compliance Focus

LexiFlow AI focuses on:

* Personal Data Protection (PDPA)
* External data sharing risks
* Consent validation
* Sensitive data detection

---
## 🧩 Chrome Extension Setup (Gmail / Google Drive Integration)

LexiFlow AI includes a browser extension that enables real-time monitoring and analysis of user-generated content in Gmail and Google Drive.

### 🔧 How to Install the Extension (Development Mode)

1. Open Google Chrome and go to:

```
chrome://extensions/
```

2. Enable **Developer Mode** (toggle at the top right corner)

3. Click **"Load unpacked"**

4. Select the following folder from the project:

```
frontend/extension
```

5. The **LexiFlow AI extension** should now appear in your extensions list

---

### ▶️ How to Use the Extension

1. Open:

   * Gmail → https://mail.google.com
   * Google Drive → https://drive.google.com

2. Click the **LexiFlow AI extension icon** at the top right of Chrome

3. The LexiFlow side panel will be injected into the page

4. Start typing or interacting with content:

   * The system will automatically detect changes
   * It will send content to the backend for analysis

5. You will see:

   * ⚠️ Risk level (low / medium / high)
   * 🧠 AI reasoning explanation
   * ✨ Safe writing suggestion (if applicable)

---

### ⚠️ Notes

* Make sure the backend server is running (local or deployed on Render)
* The extension requires access to page content (Gmail / Drive)
* This extension is currently in **development mode** and not published on the Chrome Web Store

---

### 🔗 Backend Connection

The extension communicates with the backend via:

```
POST /analyze
GET /audit-log
GET /report
```

Ensure the correct backend URL is configured (e.g., local or deployed endpoint)

---

## 👥 Team

* Product / PM: Cadee
* Frontend: Evelyn
* Backend / AI: Madeline

---

## 💡 Future Improvements

* PDF / image scanning (OCR)
* Spreadsheet analysis
* Multi-platform extension (Outlook, WhatsApp Web, etc.)
* Persistent database for audit logs
* Advanced policy customization
