// Shapes of the structured data we store as JSON and show on pages.

export type MinutesData = {
  summary: string;
  attendees: string[];
  absent: string[];
  call_to_order?: string;
  adjourned?: string;
  agenda: string[];
  discussion: { topic: string; points: string[] }[];
  decisions: string[];
  action_items: { task: string; owner?: string; due?: string }[];
  resolutions: { title: string; whereas: string[]; resolved: string[] }[];
  budget_items: { description: string; amount: number | null }[];
  budget_check?: { total: number; available: number; over: boolean };
  used_ai?: boolean;
};

export type ReportLine = {
  date: string;
  kind: "income" | "expense";
  description: string;
  category: string | null;
  project: string | null;
  amount: number;
  reference: string | null;
  /** number of receipt photos (reports made before receipts existed do not have it) */
  receipts?: number;
};

export type ReportData = {
  period: { from: string; to: string };
  income: number;
  expense: number;
  net: number;
  fund: { total: number; committed: number; available: number };
  byCategory: { category: string; amount: number }[];
  byProject: { project: string; budget: number; spent: number }[];
  lines: ReportLine[];
  flags: string[];
  used_ai?: boolean;
};

export type Proposal = {
  beneficiaries: string;
  duration: string;
  objectives: string[];
  activities: { name: string; description: string }[];
  budget_lines: { item: string; qty: number; unit: string; unit_cost: number }[];
  expected_outcomes: string[];
  risks: string[];
  /** true when the proposal is a generic template, not tailored by AI. */
  template?: boolean;
};
