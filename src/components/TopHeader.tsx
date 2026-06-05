import { Bell, ChevronDown } from "lucide-react";

type TopHeaderProps = {
  entityName: string;
};

export function TopHeader({ entityName }: TopHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line-soft/60 px-9">
      <div className="flex items-baseline gap-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[18px] font-medium tracking-tight text-ink-main">
            镜流
          </span>
          <span className="text-[13px] font-medium tracking-[0.22em] text-ink-graphite">
            AP
          </span>
        </div>
        <span className="hidden text-[11.5px] tracking-wide text-ink-muted md:inline">
          面向多主体成长企业的 AI 原生应付管理中枢
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button className="group flex items-center gap-2 rounded-full px-2 py-1 text-[12px] text-ink-graphite transition-colors duration-300 ease-gentle hover:bg-bg-soft">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line-soft text-[9px] font-medium text-ink-graphite">
            星
          </span>
          <span className="text-ink-main">{entityName}</span>
          <ChevronDown
            size={12}
            strokeWidth={1.4}
            className="text-ink-muted transition-transform duration-300 group-hover:translate-y-0.5"
          />
        </button>

        <button className="relative flex h-7 w-7 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink-graphite">
          <Bell size={14} strokeWidth={1.5} />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent-gold" />
        </button>
      </div>
    </header>
  );
}
