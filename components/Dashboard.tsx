"use client";

import { logs } from "../lib/mock-data";
import type { LogItem, LogStatus, RiskLevel, ReviewState } from "../types";

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

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | LogStatus>("ALL");
  const [riskFilter, setRiskFilter] = useState<"ALL" | RiskLevel>("ALL");
  const [logsData, setLogsData] = useState<LogItem[]>(logs);
  const [selected, setSelected] = useState<LogItem>(logs[0]);

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
                : log.source_type === "uploaded_pdf"
                ? "Drive"
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
              `Source type: ${log.source_type}`,
              `Trigger mode: ${log.trigger_mode}`,
              `Recommended action: ${log.recommended_action || "N/A"}`,
            ],
            rawDetection: log.input || "No captured content",
            automatedPolicy:
              log.recommended_action || "Review incident manually.",
          }));

          setLogsData(mappedLogs);
          setSelected(mappedLogs[0]);
        }
      } catch (error) {
        console.error(error);
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
        log.id.toLowerCase().includes(q);

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

  return (
    <main className="min-h-screen bg-[#f3f5f9] text-[#101828]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-[#f8fafc] px-5 py-3">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Shield className="h-6 w-6 fill-white text-white" />
          </div>

          <div className="text-xl font-black">LexiFlow AI</div>

          <div className="relative ml-5 hidden md:block">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search protected activity..."
              className="h-10 w-[360px] rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-600">
            • SYSTEM ACTIVE
          </div>
          <Bell className="h-6 w-6 text-slate-500" />
          <Settings className="h-6 w-6 text-slate-500" />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
            <User className="h-6 w-6 text-slate-500" />
          </div>
        </div>
      </header>

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
                      className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
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
                  AI Assistant
                </h3>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                      <Shield className="h-5 w-5 fill-white text-white" />
                    </div>

                    <div>
                      <p className="font-bold">LexiFlow AI Assistant</p>
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
                      I can flag passwords, IDs, phone numbers, and risky data
                      sharing.
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                    Ask LexiFlow about trends, incidents, and policy alerts.
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-black">
                      View Demo
                    </button>

                    <button className="flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-black text-white">
                      Open Assistant
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
                  {selected?.forensicTrace.map((step, i) => (
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