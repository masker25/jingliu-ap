// v1 Responsibility-report engine (heuristic mock — runs in the browser, no key).
// Mirrors the spec's pipeline: parse chat -> find commitments -> extract the five
// fields -> normalize time -> dedupe -> mark conflicts/missing -> attach sources.
// Quality is intentionally modest; the same shape is produced by the real LLM
// engine once a key lands. The front-end NEVER shows the English enum — every
// exception carries a concrete Chinese label.

export type Side = "ours" | "theirs" | "unclear_side";

export type ExceptionField = "side" | "action" | "deliverable" | "due" | "next";
export interface Exception {
  field: ExceptionField;
  label: string; // concrete Chinese, e.g. 责任不明 / 缺截止日期 / 日期冲突：…
}

export interface SourceRef {
  speaker: string;
  text: string;
  line: number;
}

export interface RItem {
  id: string;
  name: string; // short item name, e.g. 报价单
  side: Side;
  action: string; // 承诺动作
  deliverable: string | null; // 交付物
  due: string | null; // 截止日期 normalized YYYY/MM/DD
  dueRaw: string | null; // original expression, kept for 判断依据
  next: string; // 下一步动作
  exceptions: Exception[];
  sources: SourceRef[];
  checked: boolean;
}

export interface Report {
  refDate: string; // YYYY/MM/DD basis used for time normalization
  items: RItem[];
}

const uid = () => crypto.randomUUID().replace(/-/g, "");

const OURS = ["我方", "我们", "我司", "本司", "咱们", "咱", "我这边", "我"];
const THEIRS = ["贵司", "贵公司", "你方", "你们", "对方", "您", "你这边", "你"];

const ACTIONS = [
  "确认", "提供", "发", "补发", "补", "盖章", "报价", "付款", "支付", "核对", "对账",
  "提交", "发送", "更新", "通知", "安排", "准备", "开票", "开具", "寄", "回复", "签", "审核",
];
const DELIVERABLES: [string, string[]][] = [
  ["报价单", ["报价单", "报价"]],
  ["发票", ["发票", "开票"]],
  ["合同", ["合同", "协议"]],
  ["对账单", ["对账单", "对账"]],
  ["付款", ["付款", "货款", "尾款", "定金"]],
  ["样品", ["样品", "样板"]],
];

const WEEK: Record<string, number> = {
  周一: 1, 周二: 2, 周三: 3, 周四: 4, 周五: 5, 周六: 6, 周日: 0, 周天: 0,
  礼拜一: 1, 礼拜二: 2, 礼拜三: 3, 礼拜四: 4, 礼拜五: 5, 礼拜六: 6, 礼拜天: 0,
};

function fmt(d: Date): string {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

// resolve a fuzzy time expression to YYYY/MM/DD against the reference date
function resolveDue(text: string, ref: Date): { due: string | null; raw: string | null } {
  // explicit M月D日 / M/D / M-D
  const m1 = text.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
  const m2 = text.match(/(\d{1,2})[/-](\d{1,2})(?![/-])/);
  const md = m1 ?? m2;
  if (md) {
    const d = new Date(ref.getFullYear(), Number(md[1]) - 1, Number(md[2]));
    return { due: fmt(d), raw: md[0] };
  }
  if (/今天|今日/.test(text)) return { due: fmt(ref), raw: "今天" };
  if (/明天|明日/.test(text)) return { due: fmt(addDays(ref, 1)), raw: "明天" };
  if (/后天/.test(text)) return { due: fmt(addDays(ref, 2)), raw: "后天" };
  // 本周X / 这周X / 下周X / 周X(前|之前)
  const wk = text.match(/(下周|本周|这周|周|礼拜)([一二三四五六日天])/);
  if (wk) {
    const key = (wk[1] === "下周" ? "周" : wk[1] === "礼拜" ? "礼拜" : "周") + wk[2];
    const target = WEEK[key] ?? WEEK["周" + wk[2]];
    if (target !== undefined) {
      const nextWeek = wk[1] === "下周";
      return { due: fmt(upcomingWeekday(ref, target, nextWeek)), raw: wk[0] };
    }
  }
  return { due: null, raw: null };
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function upcomingWeekday(ref: Date, target: number, forceNextWeek: boolean): Date {
  let diff = (target - ref.getDay() + 7) % 7;
  if (diff === 0) diff = 7; // "this Friday" when today is Friday -> treat as upcoming
  if (forceNextWeek) diff += 7;
  return addDays(ref, diff);
}

interface Msg {
  speaker: string;
  text: string;
  line: number;
}

function parseMessages(input: string): Msg[] {
  const msgs: Msg[] = [];
  let speaker = "未知";
  input.split(/\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    // "名字：内容" or "[10:00] 名字：内容"
    const m = line.match(/^(?:\[[^\]]*\]\s*)?([^：:]{1,12})[：:]\s*(.+)$/);
    if (m) {
      speaker = m[1].trim();
      msgs.push({ speaker, text: m[2].trim(), line: i + 1 });
    } else {
      msgs.push({ speaker, text: line, line: i + 1 });
    }
  });
  return msgs;
}

function detectSide(text: string): Side {
  const ours = OURS.some((p) => text.includes(p));
  const theirs = THEIRS.some((p) => text.includes(p));
  if (ours && !theirs) return "ours";
  if (theirs && !ours) return "theirs";
  return "unclear_side";
}

function detectDeliverable(text: string): string | null {
  for (const [label, cues] of DELIVERABLES) if (cues.some((c) => text.includes(c))) return label;
  return null;
}

function detectAction(text: string): string | null {
  // keep the sentence concise as the action; require an action cue to qualify
  if (!ACTIONS.some((a) => text.includes(a))) return null;
  return text.replace(/[，,。.！!？?]+$/, "").slice(0, 40);
}

const SIDE_LABEL: Record<Side, string> = {
  ours: "我方承诺",
  theirs: "对方承诺",
  unclear_side: "责任不明",
};

export function extractReport(input: string, refDateISO?: string): Report {
  const ref = refDateISO ? new Date(refDateISO) : new Date(2026, 5, 23);
  const msgs = parseMessages(input);

  const raw: RItem[] = [];
  for (const msg of msgs) {
    for (const sentence of msg.text.split(/[。；;！!]+/)) {
      const s = sentence.trim();
      if (s.length < 3) continue;
      const action = detectAction(s);
      if (!action) continue;
      const side = detectSide(s);
      const deliverable = detectDeliverable(s);
      const { due, raw: dueRaw } = resolveDue(s, ref);
      raw.push({
        id: uid(),
        name: deliverable ?? action.slice(0, 12),
        side,
        action,
        deliverable,
        due,
        dueRaw,
        next: "",
        exceptions: [],
        sources: [{ speaker: msg.speaker, text: msg.text, line: msg.line }],
        checked: false,
      });
    }
  }

  // dedupe by (side + deliverable + action-head); merge sources; flag date conflicts
  const byKey = new Map<string, RItem>();
  for (const it of raw) {
    const key = `${it.side}|${it.deliverable ?? ""}|${it.action.slice(0, 6)}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, it);
      continue;
    }
    prev.sources.push(...it.sources);
    if (it.due && prev.due && it.due !== prev.due) {
      prev.exceptions.push({ field: "due", label: `日期冲突：${prev.due} vs ${it.due}` });
    } else if (it.due && !prev.due) {
      prev.due = it.due;
      prev.dueRaw = it.dueRaw;
    }
  }

  const items = [...byKey.values()];
  for (const it of items) {
    if (it.side === "unclear_side")
      it.exceptions.push({ field: "side", label: "责任不明" });
    if (!it.deliverable)
      it.exceptions.push({ field: "deliverable", label: "缺交付物" });
    if (!it.due && !it.exceptions.some((e) => e.field === "due"))
      it.exceptions.push({ field: "due", label: "缺截止日期" });
    if (it.action.length < 5)
      it.exceptions.push({ field: "action", label: "证据不足" });

    // next step: concrete, especially for exceptions
    if (it.side === "unclear_side") it.next = "向双方确认由谁负责及提交时间";
    else if (it.exceptions.some((e) => e.field === "due")) it.next = "确认明确截止时间";
    else it.next = `跟进${it.deliverable ?? "该事项"}是否按时完成`;
  }

  return { refDate: fmt(ref), items };
}

export { SIDE_LABEL };
