"use client";

import type { LogItem, LogStatus, RiskLevel, ReviewState } from "../types/index";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Search,
  Settings,
  User,
  Mail,
  MessageSquare,
  HardDrive,
  Shield,
  ChevronDown,
  X,
  Globe,
} from "lucide-react";

function getPlatformIcon(platform: LogItem["platform"]) {
  switch (platform) {
    case "Gmail":
      return <Mail className="h-4 w-4" />;
    case "Slack":
      return <MessageSquare className="h-4 w-4" />;
    case "Drive":
      return <HardDrive className="h-4 w-4" />;
    case "API":
      return <Globe className="h-4 w-4" />;
    default:
      return <Mail className="h-4 w-4" />;
  }
}

function statusBadge(status: LogStatus) {
  switch (status) {
    case "BLOCKED":
      return "border border-red-200 bg-red-50 text-red-500";
    case "FLAGGED":
      return "border border-orange-200 bg-orange-50 text-orange-500";
    case "ESCALATED":
      return "border border-blue-200 bg-blue-50 text-blue-500";
    case "APPROVED":
      return "border border-green-200 bg-green-50 text-green-600";
    default:
      return "border border-slate-200 bg-slate-50 text-slate-500";
  }
}

function riskBadge(level: RiskLevel) {
  switch (level) {
    case "LOW":
      return "border-green-300 text-green-600";
    case "MEDIUM":
      return "border-blue-300 text-blue-600";
    case "HIGH":
      return "border-orange-300 text-orange-500";
    case "CRITICAL":
      return "border-red-300 text-red-500";
    default:
      return "border-slate-300 text-slate-500";
  }
}

function reviewDot(state: ReviewState) {
  switch (state) {
    case "Pending":
      return "bg-yellow-400";
    case "Flagged":
      return "bg-red-400";
    case "Reviewed":
      return "bg-green-500";
    default:
      return "bg-slate-400";
  }
}

type ReportRange = "today" | "this_week" | "this_month" | "all" | "custom";

type AssistantMessage = {
  role: "ai" | "user";
  text: string;
};

const mockLogs: LogItem[] = [
  {
    id: "MOCK-1001",
    date: "2026-04-25",
    time: "09:12:34",
    identity: "Workspace User",
    email: "user@lexiflow.ai",
    platform: "Gmail",
    action: "send_attempt",
    status: "BLOCKED",
    riskScore: 92,
    riskLevel: "CRITICAL",
    reviewState: "Pending",
    forensicTrace: [
      "Source type: email_page",
      "Detected IC number and phone number in outgoing Gmail draft",
      "External recipient detected",
      "Recommended action: block send and rewrite message",
    ],
    rawDetection:
      "Customer IC: 990101-10-1234 and phone number: 012-3456789. Please send to external vendor.",
    automatedPolicy:
      "Remove or mask IC and phone number before sending. Use an approved secure channel for personal data sharing.",
  },
  {
    id: "MOCK-1002",
    date: "2026-04-25",
    time: "09:48:11",
    identity: "Finance Team",
    email: "finance@lexiflow.ai",
    platform: "Drive",
    action: "file_upload",
    status: "ESCALATED",
    riskScore: 88,
    riskLevel: "HIGH",
    reviewState: "Flagged",
    forensicTrace: [
      "Source type: uploaded_pdf",
      "Detected bank account details in uploaded document",
      "Document appears to be shared outside the workspace",
      "Recommended action: escalate for compliance review",
    ],
    rawDetection:
      "Uploaded PDF contains customer bank account number, billing address, and payment reference.",
    automatedPolicy:
      "Escalate to compliance officer before external sharing. Restrict file access until review is completed.",
  },
  {
    id: "MOCK-1003",
    date: "2026-04-25",
    time: "10:05:22",
    identity: "HR Operations",
    email: "hr@lexiflow.ai",
    platform: "Slack",
    action: "message_scan",
    status: "FLAGGED",
    riskScore: 64,
    riskLevel: "MEDIUM",
    reviewState: "Pending",
    forensicTrace: [
      "Source type: web_page",
      "Detected employee email address and internal staff ID",
      "Sharing context unclear",
      "Recommended action: verify purpose before posting",
    ],
    rawDetection:
      "Please check employee ID EMP-2048 and contact sarah.lim@company.com for payroll issue.",
    automatedPolicy:
      "Confirm business purpose and avoid sharing staff identifiers in public or cross-team channels.",
  },
  {
    id: "MOCK-1004",
    date: "2026-04-25",
    time: "10:33:09",
    identity: "Support Agent",
    email: "support@lexiflow.ai",
    platform: "Gmail",
    action: "auto_scan",
    status: "APPROVED",
    riskScore: 18,
    riskLevel: "LOW",
    reviewState: "Reviewed",
    forensicTrace: [
      "Source type: email_page",
      "No sensitive personal data detected",
      "Purpose appears valid",
      "Recommended action: allow send",
    ],
    rawDetection:
      "Hi, your support request has been received. Our team will respond within 24 hours.",
    automatedPolicy: "Approved. No compliance issue detected.",
  },
  {
    id: "MOCK-1005",
    date: "2026-04-25",
    time: "11:14:56",
    identity: "Sales Team",
    email: "sales@lexiflow.ai",
    platform: "API",
    action: "external_share",
    status: "BLOCKED",
    riskScore: 81,
    riskLevel: "HIGH",
    reviewState: "Pending",
    forensicTrace: [
      "Source type: manual_input",
      "Detected customer contact list in outbound payload",
      "Bulk personal data exposure risk detected",
      "Recommended action: block API request",
    ],
    rawDetection:
      "Exporting customer names, phone numbers, emails, and purchase history to third-party marketing API.",
    automatedPolicy:
      "Block export until consent, purpose limitation, and data minimization requirements are confirmed.",
  },
  {
    id: "MOCK-1006",
    date: "2026-04-25",
    time: "12:02:17",
    identity: "Project Coordinator",
    email: "project@lexiflow.ai",
    platform: "Drive",
    action: "image_upload",
    status: "FLAGGED",
    riskScore: 58,
    riskLevel: "MEDIUM",
    reviewState: "Pending",
    forensicTrace: [
      "Source type: uploaded_image",
      "Possible screenshot containing visible email addresses detected",
      "OCR confidence requires human review",
      "Recommended action: review image before sharing",
    ],
    rawDetection:
      "Uploaded screenshot may contain participant names, Gmail addresses, and internal meeting notes.",
    automatedPolicy:
      "Review and blur visible personal identifiers before sharing the image externally.",
  },
  {
    id: "MOCK-1007",
    date: "2026-04-25",
    time: "13:25:43",
    identity: "Admin User",
    email: "admin@lexiflow.ai",
    platform: "Gmail",
    action: "send_attempt",
    status: "ESCALATED",
    riskScore: 96,
    riskLevel: "CRITICAL",
    reviewState: "Flagged",
    forensicTrace: [
      "Source type: email_page",
      "Detected password-like string in outgoing message",
      "Recipient appears external",
      "Recommended action: escalate and rotate exposed credential",
    ],
    rawDetection:
      "Temporary login password: Admin@2026! Please use this to access the shared account.",
    automatedPolicy:
      "Do not send passwords through email. Use a secure password manager and rotate the exposed credential immediately.",
  },
  {
    id: "MOCK-1008",
    date: "2026-04-25",
    time: "14:10:08",
    identity: "Legal Reviewer",
    email: "legal@lexiflow.ai",
    platform: "Slack",
    action: "message_scan",
    status: "APPROVED",
    riskScore: 22,
    riskLevel: "LOW",
    reviewState: "Reviewed",
    forensicTrace: [
      "Source type: web_page",
      "No direct personal identifiers detected",
      "Internal-only discussion context detected",
      "Recommended action: allow message",
    ],
    rawDetection:
      "Please review the compliance checklist before tomorrow's internal meeting.",
    automatedPolicy: "Approved. Content is low risk and suitable for internal sharing.",
  },
];

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | LogStatus>("ALL");
  const [riskFilter, setRiskFilter] = useState<"ALL" | RiskLevel>("ALL");
  const [logsData, setLogsData] = useState<LogItem[]>([]);
  const [selected, setSelected] = useState<LogItem | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showAssistantModal, setShowAssistantModal] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportRange, setReportRange] = useState<ReportRange>("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportResult, setReportResult] = useState<any>(null);

  const [assistantInput, setAssistantInput] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    {
      role: "ai",
      text: "Hi, I’m LexiFlow Compliance Copilot. Ask me about risky content, blocked incidents, reports, or safer rewrites.",
    },
  ]);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const res = await fetch(
          "https://lexiflow-ai-backend.onrender.com/audit-log"
        );
        const data = await res.json();

        if (data.logs && Array.isArray(data.logs) && data.logs.length > 0) {
          const mappedLogs: LogItem[] = data.logs.map((log: any, index: number) => ({
            id: log.session_id || `API-${index + 1}`,
            date: log.timestamp?.split(" ")[0] || "2026-04-18",
            time: log.timestamp?.split(" ")[1] || "00:00:00",
            identity: "Workspace User",
            email: "protected-session@lexiflow.ai",
            platform:
              log.source_type === "email_page"
                ? "Gmail"
                : log.source_type === "uploaded_pdf" || log.source_type === "uploaded_image"
                ? "Drive"
                : log.source_type === "web_page"
                ? "API"
                : "API",
            action: log.trigger_mode || "auto_scan",
            status: (log.status || "FLAGGED").toUpperCase() as LogStatus,
            riskScore: log.risk_score || 0,
            riskLevel:
              log.risk_level?.toUpperCase() === "CRITICAL"
                ? "CRITICAL"
                : log.risk_level?.toUpperCase() === "HIGH"
                ? "HIGH"
                : log.risk_level?.toUpperCase() === "MEDIUM"
                ? "MEDIUM"
                : "LOW",
            reviewState: "Pending",
            forensicTrace: [
              `Source type: ${log.source_type || "unknown"}`,
              `Trigger mode: ${log.trigger_mode || "unknown"}`,
              `Recommended action: ${log.recommended_action || "N/A"}`,
            ],
            rawDetection: log.input || "No captured content",
            automatedPolicy: log.recommended_action || "Review incident manually.",
          }));

          setLogsData(mappedLogs);
          setSelected(mappedLogs.length > 0 ? mappedLogs[0] : null);
        } else {
          setLogsData(mockLogs);
          setSelected(mockLogs[0]);
        }
      } catch (error) {
        console.error(error);
        setLogsData(mockLogs);
        setSelected(mockLogs[0]);
      }
    };

    fetchAuditLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logsData.filter((log) => {
      const q = search.toLowerCase();

      const matchesSearch =
        log.identity.toLowerCase().includes(q) ||
        log.email.toLowerCase().includes(q) ||
        log.platform.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q) ||
        log.rawDetection.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ? true : log.status === statusFilter;

      const matchesRisk =
        riskFilter === "ALL" ? true : log.riskLevel === riskFilter;

      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [logsData, search, statusFilter, riskFilter]);

  const activeRiskEvents = logsData.filter(
    (l) =>
      l.status === "BLOCKED" ||
      l.status === "FLAGGED" ||
      l.status === "ESCALATED"
  ).length;

  const protectedSessions = logsData.length;
  const monitoredStreams = 4;
  const preventedLeaks = logsData.filter((l) => l.status === "BLOCKED").length;

  async function handleGenerateReport() {
    try {
      let url = "https://lexiflow-ai-backend.onrender.com/report";

      if (reportRange === "custom") {
        if (!startDate || !endDate) {
          alert("Please choose both start date and end date.");
          return;
        }
        url += `?start_date=${startDate}&end_date=${endDate}`;
      } else {
        url += `?period=${reportRange}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setReportResult(data);
    } catch (error) {
      console.error("Failed to generate report:", error);
    }
  }

  function handleExportReport() {
    if (!reportResult) return;

    const csvRows = [
      ["field", "value"],
      ...Object.entries(reportResult).map(([key, value]) => [
        key,
        typeof value === "object" ? JSON.stringify(value) : String(value),
      ]),
    ];

    const csv = csvRows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `lexiflow-${reportRange}-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function getReportLabel() {
    switch (reportRange) {
      case "today":
        return "Today";
      case "this_week":
        return "This Week";
      case "this_month":
        return "This Month";
      case "all":
        return "All Time";
      case "custom":
        return "Custom";
      default:
        return "-";
    }
  }

  function getNestedReportValue(path: string[], fallback = "0") {
    if (!reportResult) return fallback;

    let current: any = reportResult;
    for (const key of path) {
      if (current?.[key] === undefined || current?.[key] === null) return fallback;
      current = current[key];
    }

    return String(current);
  }


  async function sendAssistantMessage(customText?: string) {
    const message = customText || assistantInput;
    if (!message.trim()) return;

    setAssistantMessages((prev) => [
      ...prev,
      { role: "user", text: message },
    ]);

    setAssistantInput("");
    setAssistantLoading(true);

    let reply = "";

    try {
      const lower = message.toLowerCase();

      if (
        lower.includes("report") ||
        lower.includes("month") ||
        lower.includes("summary") ||
        lower.includes("trend")
      ) {
        const res = await fetch(
          "https://lexiflow-ai-backend.onrender.com/report?period=this_month"
        );
        const data = await res.json();

        reply = `This month compliance summary:\n\nTotal scans: ${
          data.total_scans || 0
        }\nHigh risk incidents: ${
          data.risk_summary?.high || 0
        }\nMedium risk incidents: ${
          data.risk_summary?.medium || 0
        }\nLow risk incidents: ${
          data.risk_summary?.low || 0
        }\nBlocked actions: ${
          data.decision_summary?.blocked || 0
        }\nEscalated actions: ${
          data.decision_summary?.escalate || 0
        }\nApproved actions: ${
          data.decision_summary?.approve || 0
        }\nMain source: ${
          Object.keys(data.source_breakdown || {})[0] || "N/A"
        }\n\nRecommendation: Review high-risk sources, reduce external sharing of personal data, and provide awareness training for repeated incidents.`;
      } else if (
        lower.includes("rewrite") ||
        lower.includes("safe") ||
        lower.includes("suggest") ||
        lower.includes("safer")
      ) {
        const res = await fetch("https://lexiflow-ai-backend.onrender.com/suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: message,
          }),
        });

        const data = await res.json();

        reply =
          data.safe_email_suggestion ||
          data.suggestion ||
          "Suggested safer version: remove personal data, mask identifiers, and use an approved secure sharing channel.";
      } else if (
        lower.includes("main issue") ||
        lower.includes("issue") ||
        lower.includes("document")
      ) {
        reply =
          "Main issue identified:\n\nSensitive information may be present in the content, such as names, phone numbers, IC numbers, email addresses, or confidential business data.\n\nWhy it matters:\nThis may create PDPA compliance risk if consent, purpose, or secure handling is not clear.\n\nRecommended action:\nRemove unnecessary personal data, mask sensitive fields, or use an approved secure channel.";
      } else if (lower.includes("blocked") || lower.includes("why")) {
        reply =
          "This action may be blocked because the content contains sensitive data combined with risky sharing behavior.\n\nCommon causes:\n• Personal identifiers\n• External recipient\n• Missing consent\n• Unclear purpose of data usage\n\nRecommended action:\nEdit the message, remove sensitive fields, or escalate for review.";
      } else {
        reply =
          "I can help with:\n\n• Explaining the main compliance issue\n• Rewriting risky email content safely\n• Summarizing monthly reports\n• Explaining why something was blocked\n• Recommending next actions";
      }
    } catch (error) {
      reply =
        "I could not reach the backend service. For safety, remove sensitive data and use approved secure sharing channels.";
    }

    setTimeout(() => {
      setAssistantMessages((prev) => [
        ...prev,
        { role: "ai", text: reply },
      ]);
      setAssistantLoading(false);
    }, 500);
  }

  return (
    <main className="min-h-screen bg-[#f3f5f9] text-[#101828]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-[#f8fafc] px-5 py-3">
        <button
          onClick={() => {
            setShowSettings(false);
            setShowProfilePage(false);
            setShowProfileMenu(false);
          }}
          className="flex items-center gap-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Shield className="h-6 w-6 fill-white text-white" />
          </div>

          <div className="text-xl font-black">LexiFlow AI</div>
        </button>

        <div className="relative ml-5 hidden md:block">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search protected activity..."
            className="h-10 w-[360px] rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none"
          />
        </div>

        <div className="flex items-center gap-5">
          <div className="rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-600">
            • SYSTEM ACTIVE
          </div>
          <Bell className="h-6 w-6 text-slate-500" />
          <button
            onClick={() => {
              setShowSettings(true);
              setShowProfilePage(false);
              setShowProfileMenu(false);
            }}
            className="text-slate-500 transition hover:text-slate-700"
          >
            <Settings className="h-6 w-6" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu((v) => !v)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-500"
            >
              <User className="h-6 w-6" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-14 z-50 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <button
                  onClick={() => {
                    setShowProfilePage(true);
                    setShowSettings(false);
                    setShowProfileMenu(false);
                  }}
                  className="flex w-full items-center gap-3 px-5 py-5 text-left text-slate-600 hover:bg-slate-50"
                >
                  <User className="h-5 w-5" />
                  View Profile
                </button>

                <button className="flex w-full items-center gap-3 border-t border-slate-200 px-5 py-5 text-left text-red-500 hover:bg-red-50">
                  <X className="h-5 w-5 rotate-45" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showSettings && (
        <section className="mx-auto max-w-[1450px] px-5 py-6">
          <h1 className="mb-6 text-3xl font-black tracking-tight">Settings</h1>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 text-2xl font-bold">General</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-lg font-medium">Language</span>
                  <span className="flex items-center gap-2 text-base text-slate-500">
                    English (US) <ChevronDown className="h-4 w-4" />
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-lg font-medium">Theme Mode</span>
                  <span className="flex items-center gap-2 text-base text-slate-500">
                    Light <ChevronDown className="h-4 w-4" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Timezone</span>
                  <span className="text-base text-slate-500">(UTC+08:00) Kuala Lumpur</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 text-2xl font-bold">Notifications</h2>
              <div className="space-y-6">
                {[
                  { label: "Extension alerts", on: true },
                  { label: "High-risk blocking", on: true },
                  { label: "Daily summary logs", on: false },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-none"
                  >
                    <span className="text-lg font-medium">{item.label}</span>
                    <div
                      className={`relative h-8 w-16 rounded-full ${
                        item.on ? "bg-blue-600" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                          item.on ? "left-9" : "left-1"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 text-2xl font-bold">Compliance Preferences</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-lg font-medium">Auto-block risky send</span>
                  <div className="relative h-8 w-16 rounded-full bg-blue-600">
                    <div className="absolute left-9 top-1 h-6 w-6 rounded-full bg-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Risk sensitivity</span>
                  <span className="text-lg font-bold text-blue-600">High</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 text-2xl font-bold">Security</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-lg font-medium">Browser extension auth</span>
                  <span className="text-lg font-bold text-green-600">ACTIVE</span>
                </div>
                <button className="w-full rounded-2xl border border-slate-200 py-3 text-lg font-semibold hover:bg-slate-50">
                  Manage Extension
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {showProfilePage && !showSettings && (
        <section className="mx-auto max-w-5xl px-5 py-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-4xl font-black text-blue-600">
                JD
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">
                  LexiFlow Workspace Admin
                </h1>
                <p className="mt-2 text-xl text-slate-500">Compliance Officer</p>
              </div>
            </div>

            <div className="mt-10 space-y-8">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  Work Email
                </p>
                <p className="mt-2 text-xl font-semibold">admin@lexiflow.ai</p>
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  Department
                </p>
                <p className="mt-2 text-xl font-semibold">Cybersecurity & Audit</p>
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  System Permissions
                </p>
                <p className="mt-2 text-xl font-semibold text-green-600">Full Write Access</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {!showSettings && !showProfilePage && (
        <section className="mx-auto max-w-[1450px] px-5 py-5">
          <h1 className="mb-6 text-3xl font-black tracking-tight">
            LexiFlow AI Commander
          </h1>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            <MetricCard
              title="Active Risk Events"
              value={String(activeRiskEvents)}
              subtitle="blocked in last 24h"
              subtitleColor="text-red-500"
            />
            <MetricCard
              title="Protected Sessions"
              value={String(protectedSessions)}
              subtitle="extension-observed events"
              subtitleColor="text-blue-600"
            />
            <MetricCard
              title="Monitored Streams"
              value={String(monitoredStreams)}
              subtitle="Gmail, Web, Files, API"
              subtitleColor="text-slate-500"
            />
            <MetricCard
              title="Prevented Leaks"
              value={String(preventedLeaks)}
              subtitle="auto-blocked today"
              subtitleColor="text-green-600"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-5">
                <div className="text-lg font-black uppercase tracking-[0.06em]">
                  Extension Audit Log
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search logs..."
                      className="h-10 w-72 rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as "ALL" | LogStatus)
                    }
                    className="h-10 rounded-2xl border border-slate-200 px-4 text-sm font-semibold"
                  >
                    <option value="ALL">ALL STATUS</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="FLAGGED">FLAGGED</option>
                    <option value="ESCALATED">ESCALATED</option>
                    <option value="APPROVED">APPROVED</option>
                  </select>

                  <select
                    value={riskFilter}
                    onChange={(e) =>
                      setRiskFilter(e.target.value as "ALL" | RiskLevel)
                    }
                    className="h-10 rounded-2xl border border-slate-200 px-4 text-sm font-semibold"
                  >
                    <option value="ALL">ALL RISK</option>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>

                  <button
                    onClick={() => setShowReportModal(true)}
                    className="h-10 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm hover:bg-blue-700"
                  >
                    Generate Report
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-4">Date / Time</th>
                      <th className="px-5 py-4">Entity</th>
                      <th className="px-5 py-4">Platform</th>
                      <th className="px-5 py-4">Action</th>
                      <th className="px-5 py-4">Risk Level</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelected(log)}
                        className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                          selected?.id === log.id ? "bg-slate-50" : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold">{log.date}</div>
                          <div className="text-sm text-slate-500">{log.time}</div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold">{log.identity}</div>
                          <div className="text-sm text-slate-500">{log.email}</div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-slate-100 p-2 text-slate-500">
                              {getPlatformIcon(log.platform)}
                            </div>
                            <span>{log.platform}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-xl px-3 py-2 text-xs font-bold ${statusBadge(
                              log.status
                            )}`}
                          >
                            {log.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-lg border px-3 py-1 text-xs font-bold ${riskBadge(
                              log.riskLevel
                            )}`}
                          >
                            {log.riskLevel}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`h-3 w-3 rounded-full ${reviewDot(
                                log.reviewState
                              )}`}
                            />
                            {log.reviewState}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-2">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <h3 className="mb-4 text-xl font-black">Protected Traffic Map</h3>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    {["Gmail", "Slack", "Google Drive", "API"].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-bold"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <h3 className="mb-4 text-xl font-black uppercase tracking-wide">
                    Compliance Copilot
                  </h3>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                        <Shield className="h-5 w-5 fill-white text-white" />
                      </div>

                      <div>
                        <p className="font-bold">LexiFlow Compliance Copilot</p>
                        <p className="text-sm text-slate-500">
                          Live compliance guidance
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="max-w-[85%] rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                        I’m monitoring outgoing content and browser activity.
                      </div>

                      <div className="ml-auto max-w-[85%] rounded-2xl bg-blue-600 px-4 py-3 text-sm text-white shadow-sm">
                        Current coverage: Gmail, Drive, Web uploads.
                      </div>

                      <div className="max-w-[85%] rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                        I can flag passwords, IDs, phone numbers, and risky data sharing.
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                      Ask LexiFlow about issues, blocked actions, safer rewrites, and reports.
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => setShowDemoModal(true)}
                        className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-black"
                      >
                        View Demo
                      </button>

                      <button
                        onClick={() => setShowAssistantModal(true)}
                        className="flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-black text-white"
                      >
                        Open Copilot
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky top-24 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-3xl font-black tracking-tight">
                Incident Inspector
              </h2>

              <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Log ID: {selected?.id}
              </p>

              <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
                      Source Session
                    </p>
                    <p className="text-2xl font-bold">{selected?.identity}</p>
                    <p className="mt-2 text-sm text-slate-500">{selected?.email}</p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
                      Protection Result
                    </p>

                    <span
                      className={`rounded-xl px-4 py-2 text-sm font-black ${statusBadge(
                        selected?.status || "FLAGGED"
                      )}`}
                    >
                      {selected?.status}
                    </span>
                  </div>
                </div>
              </section>

              <section className="mt-6">
                <h3 className="mb-3 text-lg font-black uppercase tracking-[0.12em]">
                  Detection Trace
                </h3>

                <div className="rounded-3xl bg-slate-50 p-5">
                  <div className="space-y-3 border-l-4 border-blue-600 pl-4">
                    {(selected?.forensicTrace || []).map((step, i) => (
                      <div key={i} className="flex gap-3 text-base">
                        <span className="font-black text-slate-400">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="mt-6">
                <h3 className="mb-3 text-lg font-black uppercase tracking-[0.12em]">
                  Captured Content
                </h3>

                <div className="rounded-3xl bg-[#111827] p-5 font-mono text-base text-green-400">
                  {selected?.rawDetection}
                </div>
              </section>

              <section className="mt-6">
                <h3 className="mb-3 text-lg font-black uppercase tracking-[0.12em]">
                  Recommended Action
                </h3>

                <div className="rounded-3xl bg-blue-50 p-5 text-base">
                  {selected?.automatedPolicy}
                </div>
              </section>
            </div>
          </div>
        </section>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Generate Risk Report</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose a period to summarize LexiFlow audit activity.
                </p>
              </div>

              <button
                onClick={() => setShowReportModal(false)}
                className="rounded-full bg-slate-100 p-3 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Report Period
                </label>
                <select
                  value={reportRange}
                  onChange={(e) => setReportRange(e.target.value as ReportRange)}
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 font-semibold outline-none"
                >
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="all">All Time</option>
                  <option value="custom">Custom Range</option>
                </select>

                {reportRange === "custom" && (
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-12 rounded-2xl border border-slate-200 px-4 outline-none"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-12 rounded-2xl border border-slate-200 px-4 outline-none"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerateReport}
                className="mt-7 h-12 rounded-2xl bg-blue-600 px-6 font-black text-white shadow-lg hover:bg-blue-700"
              >
                Generate
              </button>
            </div>

            {reportResult && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <ReportCard title="Total Scans" value={getNestedReportValue(["total_scans"])} />
                  <ReportCard title="Blocked" value={getNestedReportValue(["decision_summary", "blocked"])} />
                  <ReportCard title="High Risk" value={getNestedReportValue(["risk_summary", "high"])} />
                  <ReportCard title="Period" value={getReportLabel()} />
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-black">Report Summary</h3>
                    <button
                      onClick={handleExportReport}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black hover:bg-slate-50"
                    >
                      Export CSV
                    </button>
                  </div>

                  <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-2xl bg-[#111827] p-4 text-sm text-green-400">
                    {JSON.stringify(reportResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-black">LexiFlow Demo Flow</h2>
              <button
                onClick={() => setShowDemoModal(false)}
                className="rounded-full bg-slate-100 p-3 text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-50 p-4">1. User types risky content in Gmail, Drive, or Teams Web.</div>
              <div className="rounded-2xl bg-slate-50 p-4">2. LexiFlow scans content in real time.</div>
              <div className="rounded-2xl bg-slate-50 p-4">3. Backend returns risk level, decision, and safe guidance.</div>
              <div className="rounded-2xl bg-slate-50 p-4">4. Dashboard report updates automatically.</div>
            </div>
          </div>
        </div>
      )}

      {showAssistantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">LexiFlow Compliance Copilot</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ask about incidents, reports, safe rewrites, and compliance actions.
                </p>
              </div>

              <button
                onClick={() => setShowAssistantModal(false)}
                className="rounded-full bg-slate-100 p-3 text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-slate-200 px-6 py-4">
              <button
                onClick={() => sendAssistantMessage("What is the main issue in this document?")}
                className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600"
              >
                Main Issue
              </button>

              <button
                onClick={() => sendAssistantMessage("Why was this blocked?")}
                className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-500"
              >
                Why Blocked?
              </button>

              <button
                onClick={() => sendAssistantMessage("Rewrite this risky email safely")}
                className="rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-600"
              >
                Safe Rewrite
              </button>

              <button
                onClick={() => sendAssistantMessage("Generate this month compliance report")}
                className="rounded-full bg-purple-50 px-4 py-2 text-sm font-bold text-purple-600"
              >
                Monthly Report
              </button>
            </div>

            <div className="h-[420px] space-y-4 overflow-y-auto bg-slate-50 px-6 py-5">
              {assistantMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    msg.role === "user"
                      ? "ml-auto bg-blue-600 text-white"
                      : "bg-white text-slate-700"
                  }`}
                >
                  {msg.text}
                </div>
              ))}

              {assistantLoading && (
                <div className="max-w-[85%] rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  LexiFlow is thinking...
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-4">
              <input
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendAssistantMessage();
                }}
                placeholder="Ask LexiFlow..."
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              />

              <button
                onClick={() => sendAssistantMessage()}
                className="rounded-2xl bg-blue-600 px-6 font-black text-white"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  subtitleColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  subtitleColor: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-base font-medium text-slate-500">{title}</p>
      <h2 className="mt-3 text-4xl font-black tracking-tight">{value}</h2>
      <p className={`mt-3 text-base ${subtitleColor}`}>{subtitle}</p>
    </div>
  );
}

function ReportCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {title}
      </p>
      <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}
