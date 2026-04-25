export type LogStatus = "BLOCKED" | "FLAGGED" | "ESCALATED" | "APPROVED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ReviewState = "Pending" | "Flagged" | "Reviewed";

export type LogItem = {
  id: string;
  date: string;
  time: string;
  identity: string;
  email: string;
  platform: "Gmail" | "Slack" | "Drive" | "API";
  action: string;
  status: LogStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  reviewState: ReviewState;
  forensicTrace: string[];
  rawDetection: string;
  automatedPolicy: string;
};