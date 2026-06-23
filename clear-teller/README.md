# clear teller

把零散、重复、矛盾的原始信息（Word / PDF / PNG / 长文本）**消化**成"逐条核对即可执行"的结构化产出——
**清单为底座、矛盾单开、内容完整可回溯**——呈现在一块发散感的无限画布上，Agent 是画布上的第二只手。

## 架构

```
前端  tldraw 无限画布 + ⌘K 唤起层 + Run Timeline        apps/web
   │   REST + SSE
中台  FastAPI 路由 + 审计拦截器 + SSE                    backend/.../api
后端  Agent 编排(异步 DAG, fan-out 并行)                 backend/.../agent
   │   模型路由层(多 provider 可插拔)                     backend/.../llm
   │   RAG 规则引擎(向量检索 + 重排)                      backend/.../rag
数据  SQLite(+sqlite-vec) · 本地FS · run-aware 审计流    backend/.../db
```

> P0 的目录里 Python 后端先合并为单个包 `clear_teller`，其内部模块
> （`api` / `agent` / `rag` / `llm` / `embeddings` / `db`）对应方案里的
> 中台与各后端服务边界，后续需要时可拆成独立包。

## 工具选型

| 层 | 选择 |
|---|---|
| 前端 | TypeScript · Vite · React · tldraw(主)+React Flow(内嵌) · cmdk · Zustand · TanStack Query · Tailwind |
| 后端 | Python 3.11+ · uv · FastAPI · Pydantic AI · LiteLLM · SQLModel · Alembic · ruff |
| 数据 | SQLite + sqlite-vec(向量) · 本地FS(文件) · run-aware 审计事件流 |
| 嵌入 | fastembed(本地默认) → Voyage(质量升级，可切) |
| 跨层 | openapi-typescript(一处定义两端类型) · just · pnpm workspace + uv |

升级路径（写并发/规模到了再切，业务零改动）：
SQLite→Postgres+pgvector · 本地FS→S3 · 进程内 asyncio→arq+Redis · fastembed→Voyage。

## 本地启动（无需 Docker）

前置：`node` `pnpm` `python3` `uv`。（可选 `just`；没有也能用下面的原始命令。）

```bash
# 后端
cd backend
uv sync
uv run uvicorn clear_teller.main:app --reload --port 8000
# 健康检查： http://localhost:8000/health   文档： http://localhost:8000/docs

# 前端（另开终端）
cd apps/web
pnpm install
pnpm dev            # http://localhost:5173

# 从后端 OpenAPI 生成前端类型（后端需在运行）
pnpm --filter web gen:types
```

有 `just` 的话，根目录 `just dev` / `just api` / `just web` / `just gen-types` 一把梭。

## 阶段

- **P0（当前）** 地基：monorepo + SQLModel schema + FastAPI 健康端点 + tldraw 空画布 + 类型打通。
- P1 纵切：长文本 → 异步 DAG(分级+去重+矛盾) → 清单+冲突区 → 画布渲染。
- P2 体验：擦除动效 + 真实进度 SSE + ⌘K 唤起 + 拖拽投喂 + 幽灵 diff 提案。
- P3 持久与轨迹：run-aware 审计 + Run Timeline + 画布恢复。
- P4 增强：多模态输入 + 个性化视图 + RAG 规则后台；按需切 Postgres/Redis/Voyage/Docker。
