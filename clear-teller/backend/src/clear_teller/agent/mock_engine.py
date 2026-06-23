"""Local, deterministic processing engine — no model, no key, no network.

It implements the same phase interface the real LLM engine will (atomize /
classify / dedupe / conflicts / checklist), using transparent heuristics so the
whole pipeline runs today. Quality is intentionally modest; swapping in a model
provider (Claude / DeepSeek / local) via the router lifts every phase without
changing the pipeline or the API.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# action cues -> a unit that tells you to *do* something becomes a checklist item
ACTION_CUES = (
    "确认 通知 导出 核对 上线 检查 完成 发送 更新 联系 准备 提交 安排 对齐 跟进 "
    "发布 部署 观察 整理 回复 创建 修改 测试 评审 沟通 汇报 申请 审核 灰度 备份"
).split()

# cues that a statement revises an earlier one -> candidate contradiction
CHANGE_CUES = ("改到 改为 改成 调整为 推迟 提前 取消 不再 变更 换成 重新定 其实").split()

# coarse 1-level categories (the real engine builds up to 3 levels)
CATEGORIES = [
    ("上线", ("上线", "发布", "部署", "灰度", "回滚")),
    ("沟通", ("通知", "客服", "运营", "联系", "沟通", "回复", "汇报")),
    ("财务/数据", ("预算", "对账", "金额", "报销", "费用", "数据")),
]

_SPLIT = re.compile(r"[。；;！!\n]+")
_BULLET = re.compile(r"^[\s\-\*•·\d]+[.、)）]?\s*")
_NORM = re.compile(r"[\s，,。.；;：:!！?？\"'“”‘’（）()\[\]【】]")


@dataclass
class EUnit:
    text: str
    provenance: str


@dataclass
class ProcessResult:
    units: list[EUnit] = field(default_factory=list)
    # taxonomy: label -> list of unit indices
    taxonomy: dict[str, list[int]] = field(default_factory=dict)
    # merges: duplicate unit index -> survivor unit index
    merges: dict[int, int] = field(default_factory=dict)
    # conflicts: (left index, right index, summary)
    conflicts: list[tuple[int, int, str]] = field(default_factory=list)
    # checklist: (text, [source unit indices])
    checklist: list[tuple[str, list[int]]] = field(default_factory=list)


def atomize(text: str) -> list[EUnit]:
    units: list[EUnit] = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        for part in _SPLIT.split(line):
            s = _BULLET.sub("", part).strip()
            if len(s) > 1:
                units.append(EUnit(text=s, provenance=f"第{lineno}行"))
    return units


def _norm(s: str) -> str:
    return _NORM.sub("", s).lower()


def _char_set(s: str) -> set[str]:
    return {c for c in _norm(s) if "一" <= c <= "鿿"}


def dedupe(units: list[EUnit]) -> dict[int, int]:
    """Map each duplicate unit index to the first (survivor) index."""
    seen: dict[str, int] = {}
    merges: dict[int, int] = {}
    for i, u in enumerate(units):
        key = _norm(u.text)
        if key in seen:
            merges[i] = seen[key]
        else:
            seen[key] = i
    return merges


def conflicts(units: list[EUnit], merges: dict[int, int]) -> list[tuple[int, int, str]]:
    """Pair a revising statement with the earlier one it most overlaps."""
    out: list[tuple[int, int, str]] = []
    for i, u in enumerate(units):
        if i in merges or not any(c in u.text for c in CHANGE_CUES):
            continue
        ci = _char_set(u.text)
        best, best_score = -1, 0.0
        for j in range(i):
            if j in merges:
                continue
            cj = _char_set(units[j].text)
            if not ci or not cj:
                continue
            score = len(ci & cj) / len(ci | cj)
            if score > best_score:
                best, best_score = j, score
        if best >= 0 and best_score >= 0.25:
            out.append((best, i, "前后表述不一致，需确认"))
    return out


def _category(text: str) -> str:
    for label, cues in CATEGORIES:
        if any(c in text for c in cues):
            return label
    return "其他"


def checklist(
    units: list[EUnit], merges: dict[int, int]
) -> tuple[list[tuple[str, list[int]]], dict[str, list[int]]]:
    items: list[tuple[str, list[int]]] = []
    taxonomy: dict[str, list[int]] = {}
    for i, u in enumerate(units):
        if i in merges or not any(cue in u.text for cue in ACTION_CUES):
            continue
        items.append((u.text, [i]))
        taxonomy.setdefault(_category(u.text), []).append(i)
    return items, taxonomy


def process(text: str) -> ProcessResult:
    units = atomize(text)
    merges = dedupe(units)
    confs = conflicts(units, merges)
    items, taxonomy = checklist(units, merges)
    return ProcessResult(
        units=units,
        taxonomy=taxonomy,
        merges=merges,
        conflicts=confs,
        checklist=items,
    )
