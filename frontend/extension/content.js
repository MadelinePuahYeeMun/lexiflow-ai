let lexiPanel = null;
let statusEl = null;
let reasonEl = null;
let scoreEl = null;
let detectedEl = null;
let sourceEl = null;

let lastAnalyzedText = "";
let lastSourceType = "";
let currentSessionId = "";

/* =========================
   PAGE DETECTION
========================= */

function getGmailContent() {
  const toField =
    document.querySelector('input[aria-label*="To"]') ||
    document.querySelector('input[aria-label="Recipients"]');

  const subjectField =
    document.querySelector('input[name="subjectbox"]') ||
    document.querySelector('input[placeholder*="Subject"]');

  const bodyField =
    document.querySelector('div[aria-label="Message Body"]') ||
    document.querySelector('div[role="textbox"]');

  const toText = toField?.value || "";
  const subjectText = subjectField?.value || "";
  const bodyText = bodyField?.innerText || "";

  return {
    sourceType: "email_page",
    toText,
    subjectText,
    combined: `To: ${toText}\nSubject: ${subjectText}\nBody: ${bodyText}`.trim(),
  };
}

function getDriveContent() {
  const pageTitle = document.title || "";
  const bodyText = document.body?.innerText || "";

  return {
    sourceType: "web_page",
    combined: `Drive Page: ${pageTitle}\n${bodyText.slice(0, 4000)}`,
  };
}

function getTeamsContent() {
  const composer =
    document.querySelector('[contenteditable="true"]') ||
    document.querySelector('div[role="textbox"]');

  const text = composer?.innerText || "";

  return {
    sourceType: "web_page",
    combined: `Teams Message:\n${text}`,
  };
}

function getPageContent() {
  const host = location.hostname;

  if (host.includes("mail.google.com")) return getGmailContent();
  if (host.includes("drive.google.com")) return getDriveContent();
  if (host.includes("teams.microsoft.com")) return getTeamsContent();

  return {
    sourceType: "web_page",
    combined: (document.body?.innerText || "").slice(0, 4000),
  };
}

/* =========================
   SESSION ID
========================= */

function generateSessionId(page) {
  const host = location.hostname;

  if (host.includes("mail.google.com")) {
    return `gmail-${(page.subjectText || "draft").replace(/\s+/g, "-")}`;
  }

  if (host.includes("drive.google.com")) {
    return `drive-${document.title.replace(/\s+/g, "-")}`;
  }

  if (host.includes("teams.microsoft.com")) {
    return `teams-${location.pathname.replace(/\//g, "-")}`;
  }

  return `${page.sourceType}-${location.pathname.replace(/\//g, "-")}`;
}

/* =========================
   PANEL UI
========================= */

function createPanel() {
  if (document.getElementById("lexiflow-side-panel")) return;

  lexiPanel = document.createElement("div");
  lexiPanel.id = "lexiflow-side-panel";

  lexiPanel.innerHTML = `
    <div id="lexiflow-header">
      <div id="lexiflow-logo">L</div>
      <div>
        <div id="lexiflow-title">LexiFlow AI Assistant</div>
        <div id="lexiflow-sub">Always-on protection</div>
      </div>
    </div>

    <div id="lexiflow-body">
      <div class="card">
        <div class="label">STATUS</div>
        <div id="lexiflow-status" class="pill safe">NO RISK</div>
      </div>

      <div class="card">
        <div class="label">SOURCE</div>
        <div id="lexiflow-source">Waiting...</div>
      </div>

      <div class="card">
        <div class="label">RISK LEVEL</div>
        <div id="lexiflow-score" class="score low">LOW</div>
      </div>

      <div class="card">
        <div class="label">REASON</div>
        <div id="lexiflow-reason">Monitoring...</div>
      </div>

      <div class="card">
        <div class="label">DETECTED</div>
        <div id="lexiflow-detected"></div>
      </div>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #lexiflow-side-panel{
      position:fixed;top:90px;right:16px;width:300px;
      background:#fff;border-radius:20px;
      box-shadow:0 10px 30px rgba(0,0,0,.1);
      z-index:999999;font-family:Arial;
    }
    #lexiflow-header{
      display:flex;gap:10px;padding:14px;background:#f8fafc;
      cursor:move;
    }
    #lexiflow-logo{
      width:36px;height:36px;background:#2563eb;
      color:#fff;display:flex;align-items:center;
      justify-content:center;border-radius:10px;
    }
    .card{padding:10px;border-bottom:1px solid #eee}
    .label{font-size:10px;color:#999}
    .pill{padding:5px 10px;border-radius:999px;font-size:12px}
    .safe{background:#dcfce7;color:#16a34a}
    .warn{background:#fef3c7;color:#d97706}
    .block{background:#fee2e2;color:#dc2626}
    .score{font-size:22px;font-weight:bold}
    .low{color:#16a34a}
    .medium{color:#d97706}
    .high{color:#dc2626}
  `;

  document.head.appendChild(style);
  document.body.appendChild(lexiPanel);

  statusEl = document.getElementById("lexiflow-status");
  reasonEl = document.getElementById("lexiflow-reason");
  scoreEl = document.getElementById("lexiflow-score");
  detectedEl = document.getElementById("lexiflow-detected");
  sourceEl = document.getElementById("lexiflow-source");

  makeDraggable();
}

/* =========================
   DRAG PANEL
========================= */

function makeDraggable() {
  const header = document.getElementById("lexiflow-header");

  let dragging = false;
  let dx = 0;
  let dy = 0;

  header.onmousedown = (e) => {
    dragging = true;
    const rect = lexiPanel.getBoundingClientRect();
    dx = e.clientX - rect.left;
    dy = e.clientY - rect.top;
  };

  document.onmousemove = (e) => {
    if (!dragging) return;
    lexiPanel.style.left = `${e.clientX - dx}px`;
    lexiPanel.style.top = `${e.clientY - dy}px`;
    lexiPanel.style.right = "auto";
  };

  document.onmouseup = () => (dragging = false);
}

/* =========================
   RENDER RESULT
========================= */

function setRisk(level) {
  scoreEl.className = "score";

  if (level === "high") {
    scoreEl.classList.add("high");
    scoreEl.textContent = "HIGH";
  } else if (level === "medium") {
    scoreEl.classList.add("medium");
    scoreEl.textContent = "MEDIUM";
  } else {
    scoreEl.classList.add("low");
    scoreEl.textContent = "LOW";
  }
}

function renderResult(data, source) {
  const status = data.status?.toLowerCase() || "approve";

  if (status === "blocked") {
    statusEl.className = "pill block";
    statusEl.textContent = "BLOCKED";
  } else if (status === "escalate") {
    statusEl.className = "pill warn";
    statusEl.textContent = "ESCALATE";
  } else {
    statusEl.className = "pill safe";
    statusEl.textContent = "SAFE";
  }

  setRisk(data.risk_level?.toLowerCase());

  reasonEl.textContent = data.reason || "";
  sourceEl.textContent = source;

  detectedEl.innerHTML = "";
  (data.detected_entities || []).forEach((d) => {
    const tag = document.createElement("span");
    tag.textContent = d;
    tag.style.marginRight = "6px";
    tag.style.fontSize = "12px";
    detectedEl.appendChild(tag);
  });
}

/* =========================
   API CALL
========================= */

async function analyze(text, sourceType, sessionId) {
  try {
    const res = await fetch(
      "https://lexiflow-ai-backend.onrender.com/analyze",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: text,
          source_type: sourceType,
          trigger_mode: "auto_scan",
          session_id: sessionId,
        }),
      }
    );

    const data = await res.json();
    renderResult(data, sourceType);
  } catch (e) {
    console.error(e);
  }
}

/* =========================
   WATCH LOOP
========================= */

function watch() {
  createPanel();

  setInterval(() => {
    const page = getPageContent();

    if (!page.combined || page.combined.length < 10) return;

    if (page.combined === lastAnalyzedText) return;

    lastAnalyzedText = page.combined;
    currentSessionId = generateSessionId(page);

    analyze(page.combined, page.sourceType, currentSessionId);
  }, 3000);
}

watch();