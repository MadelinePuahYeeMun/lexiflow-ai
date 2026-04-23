import type { LogItem } from "../types";

export const logs: LogItem[] = [
  {
    id: "AL-1092",
    date: "2026-04-18",
    time: "10:32:14 AM",
    identity: "John Doe",
    email: "j.doe@enterprise.com",
    platform: "Gmail",
    action: "Outbound SMTP",
    status: "BLOCKED",
    riskScore: 92,
    riskLevel: "CRITICAL",
    reviewState: "Pending",
    forensicTrace: [
      "Scan initiated on outbound SMTP",
      "Entity extracted: 3x Phone Numbers",
      "Policy match: ENTERPRISE_PII_PROTECTION"
    ],
    rawDetection: "Draft contains phone numbers",
    automatedPolicy: "Review data privacy training with user."
  }
];