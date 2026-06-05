export type APTaskStatus =
  | "auto_matchable"
  | "need_po"
  | "risk_review"
  | "merge_payment"
  | "manual_confirm"
  | "ready_to_book"
  | "blocked"
  | "completed";

export type APFlowStage =
  | "signal_ingested"
  | "ai_understanding"
  | "trusted_verification"
  | "suggested_action"
  | "confirmed";

export type RiskLevel = "low" | "medium" | "high";

export type APTaskType =
  | "invoice"
  | "payment_request"
  | "supplier_bill"
  | "expense"
  | "po_match";

export type RawSignal = {
  label: string;
  value: string;
  hint?: string;
};

export type ReasoningChipType =
  | "supplier"
  | "contract"
  | "tax"
  | "budget"
  | "duplicate"
  | "history"
  | "po"
  | "entity";

export type ReasoningChip = {
  id: string;
  label: string;
  type: ReasoningChipType;
  passed: boolean;
};

export type EvidenceItem = {
  id: string;
  title: string;
  description: string;
  strength: "high" | "medium" | "low";
  source?: string;
};

export type AIJudgment = {
  confidence: number;
  result: string;
  suggestedAction: string;
  statusLine: string;
  riskLevel: RiskLevel;
  currentStage: APFlowStage;
};

export type APTask = {
  id: string;
  type: APTaskType;
  supplier: string;
  entity: string;
  amount: number;
  currency?: string;
  taxAmount?: number;
  applicant?: string;
  dueDate?: string;
  invoiceNo?: string;
  category?: string;
  status: APTaskStatus;
  rawSignals: RawSignal[];
  aiJudgment: AIJudgment;
  reasoningChips: ReasoningChip[];
  evidences: EvidenceItem[];
};

export const FLOW_STAGES: { id: APFlowStage; label: string }[] = [
  { id: "signal_ingested", label: "信号接入" },
  { id: "ai_understanding", label: "AI 理解" },
  { id: "trusted_verification", label: "可信验证" },
  { id: "suggested_action", label: "建议动作" },
  { id: "confirmed", label: "已确认" },
];

export const STATUS_LABEL: Record<APTaskStatus, string> = {
  auto_matchable: "可自动匹配",
  need_po: "需补充 PO",
  risk_review: "风险待核验",
  merge_payment: "建议合并付款",
  manual_confirm: "待人工确认",
  ready_to_book: "可入账待复核",
  blocked: "已阻塞",
  completed: "已确认",
};
