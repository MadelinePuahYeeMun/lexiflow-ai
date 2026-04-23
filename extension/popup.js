const pageInfo = document.getElementById("pageInfo");
const contentPreview = document.getElementById("contentPreview");
const sourceType = document.getElementById("sourceType");
const triggerMode = document.getElementById("triggerMode");
const scanBtn = document.getElementById("scanBtn");

const statusBox = document.getElementById("statusBox");
const statusBadge = document.getElementById("statusBadge");
const riskBadge = document.getElementById("riskBadge");
const riskScore = document.getElementById("riskScore");
const reasonText = document.getElementById("reasonText");
const suggestionText = document.getElementById("suggestionText");

async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function loadPageContent() {
  const tab = await getCurrentTab();
  pageInfo.textContent = tab?.url || "Unknown page";

  if (tab?.url?.includes("mail.google.com")) {
    sourceType.value = "email_page";
  } else if (tab?.url?.includes("messenger.com")) {
    sourceType.value = "web_page";
  }

  chrome.tabs.sendMessage(tab.id, { type: "LEXIFLOW_GET_CONTENT" }, (response) => {
    if (chrome.runtime.lastError) {
      contentPreview.value = "";
      pageInfo.textContent = "Unable to read page content on this tab.";
      return;
    }

    const text = response?.content || "";
    contentPreview.value = text.slice(0, 3000);
  });
}

function paintResult(data) {
  statusBox.classList.remove("hidden");

  const status = (data.status || "escalate").toUpperCase();
  const risk = (data.risk_level || "medium").toUpperCase();

  statusBadge.textContent = status;
  riskBadge.textContent = risk;
  riskScore.textContent = data.risk_score ?? "-";
  reasonText.textContent = data.reason || "-";
  suggestionText.textContent = data.suggestion || "-";

  statusBadge.style.background =
    status === "BLOCKED" ? "#fee2e2" :
    status === "APPROVE" || status === "APPROVED" ? "#dcfce7" :
    "#fef3c7";

  statusBadge.style.color =
    status === "BLOCKED" ? "#dc2626" :
    status === "APPROVE" || status === "APPROVED" ? "#16a34a" :
    "#d97706";
}

scanBtn.addEventListener("click", async () => {
  try {
    scanBtn.textContent = "Analyzing...";
    scanBtn.disabled = true;

    const res = await fetch("https://botany-skeletal-clean.ngrok-free.dev/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({
        input: contentPreview.value,
        source_type: sourceType.value,
        trigger_mode: triggerMode.value
      })
    });

    const data = await res.json();
    paintResult(data);
  } catch (error) {
    console.error("Analyze failed:", error);
    paintResult({
      status: "escalate",
      risk_level: "medium",
      risk_score: 50,
      reason: "Unable to connect to backend.",
      suggestion: "Please try again later."
    });
  } finally {
    scanBtn.textContent = "Analyze Current Page";
    scanBtn.disabled = false;
  }
});

loadPageContent();