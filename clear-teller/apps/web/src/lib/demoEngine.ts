// In-browser port of the backend mock engine, so the deployed demo runs with no
// server. Same heuristics as backend/.../agent/mock_engine.py: atomize / dedupe /
// conflict / checklist. When the real LLM engine lands, the hosted app points
// back at the API and this is only used for the offline demo.

const ACTION_CUES =
  "确认 通知 导出 核对 上线 检查 完成 发送 更新 联系 准备 提交 安排 对齐 跟进 发布 部署 观察 整理 回复 创建 修改 测试 评审 沟通 汇报 申请 审核 灰度 备份".split(
    " ",
  );
const CHANGE_CUES = "改到 改为 改成 调整为 推迟 提前 取消 不再 变更 换成 重新定 其实".split(" ");
const CATEGORIES: [string, string[]][] = [
  ["上线", ["上线", "发布", "部署", "灰度", "回滚"]],
  ["沟通", ["通知", "客服", "运营", "联系", "沟通", "回复", "汇报"]],
  ["财务/数据", ["预算", "对账", "金额", "报销", "费用", "数据"]],
];

export type EUnit = { id: string; text: string; provenance: string };
export type Conflict = { leftIdx: number; rightIdx: number; summary: string };
export type ChecklistItem = { text: string; sourceIdx: number[] };
export type ProcessResult = {
  units: EUnit[];
  merges: Record<number, number>;
  conflicts: Conflict[];
  checklist: ChecklistItem[];
};

const uid = () => crypto.randomUUID().replace(/-/g, "");
const norm = (s: string) => s.replace(/[\s，,。.；;：:!！?？"'“”‘’（）()[\]【】]/g, "").toLowerCase();
const charSet = (s: string) => new Set([...norm(s)].filter((c) => c >= "一" && c <= "鿿"));

function atomize(text: string): EUnit[] {
  const units: EUnit[] = [];
  text.split(/\n/).forEach((line, i) => {
    line.split(/[。；;！!]+/).forEach((part) => {
      const s = part.replace(/^[\s\-*•·\d]+[.、)）]?\s*/, "").trim();
      if (s.length > 1) units.push({ id: uid(), text: s, provenance: `第${i + 1}行` });
    });
  });
  return units;
}

function dedupe(units: EUnit[]): Record<number, number> {
  const seen: Record<string, number> = {};
  const merges: Record<number, number> = {};
  units.forEach((u, i) => {
    const k = norm(u.text);
    if (k in seen) merges[i] = seen[k];
    else seen[k] = i;
  });
  return merges;
}

function conflicts(units: EUnit[], merges: Record<number, number>): Conflict[] {
  const out: Conflict[] = [];
  units.forEach((u, i) => {
    if (i in merges || !CHANGE_CUES.some((c) => u.text.includes(c))) return;
    const ci = charSet(u.text);
    let best = -1;
    let bestScore = 0;
    for (let j = 0; j < i; j++) {
      if (j in merges) continue;
      const cj = charSet(units[j].text);
      if (!ci.size || !cj.size) continue;
      const inter = [...ci].filter((c) => cj.has(c)).length;
      const union = new Set([...ci, ...cj]).size;
      const score = inter / union;
      if (score > bestScore) {
        best = j;
        bestScore = score;
      }
    }
    if (best >= 0 && bestScore >= 0.25)
      out.push({ leftIdx: best, rightIdx: i, summary: "前后表述不一致，需确认" });
  });
  return out;
}

function category(text: string): string {
  for (const [label, cues] of CATEGORIES) if (cues.some((c) => text.includes(c))) return label;
  return "其他";
}

function checklist(units: EUnit[], merges: Record<number, number>): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  units.forEach((u, i) => {
    if (i in merges || !ACTION_CUES.some((c) => u.text.includes(c))) return;
    items.push({ text: u.text, sourceIdx: [i] });
  });
  // category is computed for parity with the backend taxonomy; unused in the UI
  void category;
  return items;
}

export function process(text: string): ProcessResult {
  const units = atomize(text);
  const merges = dedupe(units);
  return {
    units,
    merges,
    conflicts: conflicts(units, merges),
    checklist: checklist(units, merges),
  };
}
