let lexiPanel = null;
let statusEl = null;
let reasonEl = null;
let scoreEl = null;
let detectedEl = null;
let sourceEl = null;
let lastAnalyzedText = "";
let lastSourceType = "";
let currentSessionId = "";

function getGmailContent() {
  const toField =
    document.querySelector('input[aria-label*="To"]') ||
    document.querySelector('input[aria-label="Recipients"]');

  const subjectField =
    document.querySelector('input[name="subjectbox"]') ||
    document.querySelector('input[placeholder*="Subject"]');

  const bodyField =
    document.querySelector('div[aria-label="Message Body"]') ||
    document.querySelector('div[role="textbox"][aria-label*="Message Body"]') ||
    document.querySelector('div[role="textbox"]');

  const toText = toField?.value || "";
  const subjectText = subjectField?.value || "";
  const bodyText = bodyField?.innerText || bodyField?.textContent || "";

  return {
    sourceType: "email_page",
    toText,
    subjectText,
    bodyText,
    combined: `To: ${toText}\nSubject: ${subjectText}\nBody: ${bodyText}`.trim(),
  };
}

function getDriveContent() {
  const pageTitle = document.title || "";
  const bodyText = document.body?.innerText || "";

  const fileNameMatch =
    bodyText.match(/[A-Za-z0-9_\- ]+\.(pdf|docx|doc|xlsx|xls|csv|png|jpg|jpeg|txt)/i);

  const fileName = fileNameMatch ? fileNameMatch[0] : pageTitle;

  let detectedSourceType = "web_page";
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf")) detectedSourceType = "uploaded_pdf";
  else if (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg")
  ) {
    detectedSourceType = "uploaded_image";
  }

  return {
    sourceType: detectedSourceType,
    fileName,
    pageTitle,
    combined: `Drive Page Title: ${pageTitle}\nPotential File: ${fileName}\nVisible Page Content:\n${bodyText.slice(0, 4000)}`.trim(),
  };
}

function getPageContent() {
  const host = window.location.hostname;

  if (host.includes("mail.google.com")) {
    return getGmailContent();
  }

  if (host.includes("drive.google.com")) {
    return getDriveContent();
  }

  return {
    sourceType: "web_page",
    combined: (document.body?.innerText || "").slice(0, 4000),
  };
}

function generateSessionId(page) {
  const host = window.location.hostname;

  if (host.includes("mail.google.com")) {
    const toPart = (page.toText || "no-recipient")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    const subjectPart = (page.subjectText || "no-subject")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    return `gmail-${toPart}-${subjectPart}`;
  }

  if (host.includes("drive.google.com")) {
    const filePart = (page.fileName || page.pageTitle || "drive-page")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    return `drive-${filePart}`;
  }

  return `${page.sourceType}-${window.location.pathname.replace(/\//g, "-")}`;
}

function createPanel() {
  if (document.getElementById("lexiflow-side-panel")) return;

  lexiPanel = document.createElement("div");
  lexiPanel.id = "lexiflow-side-panel";
  lexiPanel.innerHTML = `
    <div id="lexiflow-header">
      <div id="lexiflow-brand">
        <div id="lexiflow-logo">L</div>
        <div>
          <div id="lexiflow-title">LexiFlow AI</div>
          <div id="lexiflow-subtitle">Real-time compliance monitor</div>
        </div>
      </div>
    </div>

    <div id="lexiflow-body">
      <div class="lexi-card">
        <div class="lexi-muted">STATUS</div>
        <div id="lexiflow-status" class="lexi-status safe">NO CURRENT RISK</div>
      </div>

      <div class="lexi-card">
        <div class="lexi-muted">SOURCE</div>
        <div id="lexiflow-source" class="lexi-text">Waiting for supported page...</div>
      </div>

      <div class="lexi-card">
        <div class="lexi-muted">RISK LEVEL</div>
        <div id="lexiflow-score" class="lexi-score low">LOW</div>
      </div>

      <div class="lexi-card">
        <div class="lexi-muted">REASON</div>
        <div id="lexiflow-reason" class="lexi-text">
          LexiFlow is monitoring this page for compliance risk.
        </div>
      </div>

      <div class="lexi-card">
        <div class="lexi-muted">DETECTED ENTITIES</div>
        <div id="lexiflow-detected" class="lexi-tags"></div>
      </div>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #lexiflow-side-panel {
      position: fixed;
      top: 90px;
      right: 16px;
      width: 320px;
      background: #ffffff;
      border: 1px solid #dbe1ea;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
      z-index: 999999;
      font-family: Arial, sans-serif;
      overflow: hidden;
      cursor: default;
    }

    #lexiflow-header {
      padding: 16px;
      border-bottom: 1px solid #eef2f7;
      background: #f8fbff;
      cursor: move;
      user-select: none;
    }

    #lexiflow-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    #lexiflow-logo {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: #2563eb;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 20px;
    }

    #lexiflow-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }

    #lexiflow-subtitle {
      font-size: 12px;
      color: #64748b;
    }

    #lexiflow-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .lexi-card {
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 12px;
      background: #ffffff;
    }

    .lexi-muted {
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
    }

    .lexi-status {
      display: inline-block;
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
    }

    .lexi-status.safe {
      background: #dcfce7;
      color: #16a34a;
    }

    .lexi-status.warn {
      background: #fef3c7;
      color: #d97706;
    }

    .lexi-status.block {
      background: #fee2e2;
      color: #dc2626;
    }

    .lexi-score {
      font-size: 28px;
      font-weight: 800;
    }

    .lexi-score.low {
      color: #16a34a;
    }

    .lexi-score.medium {
      color: #d97706;
    }

    .lexi-score.high {
      color: #dc2626;
    }

    .lexi-text {
      font-size: 14px;
      line-height: 1.5;
      color: #334155;
    }

    .lexi-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .lexi-tag {
      padding: 6px 10px;
      border-radius: 999px;
      background: #dbeafe;
      color: #1d4ed8;
      font-size: 12px;
      font-weight: 600;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(lexiPanel);

  statusEl = document.getElementById("lexiflow-status");
  reasonEl = document.getElementById("lexiflow-reason");
  scoreEl = document.getElementById("lexiflow-score");
  detectedEl = document.getElementById("lexiflow-detected");
  sourceEl = document.getElementById("lexiflow-source");

  makePanelDraggable();
}

function makePanelDraggable() {
  const header = document.getElementById("lexiflow-header");
  if (!header || !lexiPanel) return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    const rect = lexiPanel.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    lexiPanel.style.left = `${e.clientX - offsetX}px`;
    lexiPanel.style.top = `${e.clientY - offsetY}px`;
    lexiPanel.style.right = "auto";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

function setRiskLevel(level) {
  const normalized = (level || "low").toLowerCase();

  scoreEl.className = "lexi-score";

  if (normalized === "high") {
    scoreEl.classList.add("high");
    scoreEl.textContent = "HIGH";
  } else if (normalized === "medium") {
    scoreEl.classList.add("medium");
    scoreEl.textContent = "MEDIUM";
  } else {
    scoreEl.classList.add("low");
    scoreEl.textContent = "LOW";
  }
}

function resetPanel(sourceType = "unknown") {
  if (!statusEl) return;

  statusEl.className = "lexi-status safe";
  statusEl.textContent = "NO CURRENT RISK";
  setRiskLevel("low");
  reasonEl.textContent = "No risky content currently detected.";
  reasonEl.style.color = "#334155";
  sourceEl.textContent = sourceType;
  detectedEl.innerHTML = "";
}

function renderResult(data, sourceType) {
  if (!statusEl) return;

  sourceEl.textContent = sourceType;

  const status = (data.status || "").toLowerCase();
  const risk = (data.risk_level || "low").toLowerCase();

  statusEl.className = "lexi-status";

  if (status === "blocked") {
    statusEl.classList.add("block");
    statusEl.textContent = "BLOCKED";
  } else if (status === "escalate") {
    statusEl.classList.add("warn");
    statusEl.textContent = "ESCALATE";
  } else if (status === "approve" || status === "approved") {
    statusEl.classList.add("safe");
    statusEl.textContent = "APPROVE";
  } else {
    statusEl.classList.add("safe");
    statusEl.textContent = "NO CURRENT RISK";
  }

  setRiskLevel(risk);
  reasonEl.textContent = data.reason || "No reason provided.";

  detectedEl.innerHTML = "";
  (data.detected_entities || []).forEach((item) => {
    const tag = document.createElement("span");
    tag.className = "lexi-tag";
    tag.textContent = item;
    detectedEl.appendChild(tag);
  });

  if (risk === "high" || status === "blocked") {
    reasonEl.style.color = "#b91c1c";
  } else if (risk === "medium") {
    reasonEl.style.color = "#b45309";
  } else {
    reasonEl.style.color = "#334155";
  }
}

async function analyzeContent(text, sourceType, sessionId) {
  try {
    console.log("LexiFlow sending analyze request:", { text, sourceType, sessionId });

    const res = await fetch("https://lexiflow-ai-backend.onrender.com/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: text,
        source_type: sourceType,
        trigger_mode: "auto_scan",
        session_id: sessionId
      })
    });

    const data = await res.json();
    console.log("LexiFlow backend response:", data);

    renderResult(data, sourceType);
  } catch (err) {
    console.error("LexiFlow analyze failed:", err);
    resetPanel(sourceType);
  }
}

function watchPage() {
  createPanel();

  setInterval(() => {
    const page = getPageContent();

    if (page.sourceType !== lastSourceType) {
      lastSourceType = page.sourceType;
      lastAnalyzedText = "";
      currentSessionId = generateSessionId(page);
      resetPanel(page.sourceType);
    }

    if (!page.combined || page.combined.length < 10) {
      resetPanel(page.sourceType);
      lastAnalyzedText = "";
      currentSessionId = generateSessionId(page);
      return;
    }

    if (page.combined === lastAnalyzedText) return;

    lastAnalyzedText = page.combined;
    currentSessionId = generateSessionId(page);
    analyzeContent(page.combined, page.sourceType, currentSessionId);
  }, 3000);
}

watchPage();