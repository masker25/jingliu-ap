import { LayoutGrid, Inbox, Receipt, BookOpen, Wallet, Settings } from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  icon: typeof LayoutGrid;
};

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "总览", icon: LayoutGrid },
  { id: "ap", label: "AP", icon: Inbox },
  { id: "ar", label: "AR", icon: Receipt },
  { id: "gl", label: "GL", icon: BookOpen },
  { id: "treasury", label: "资金", icon: Wallet },
  { id: "settings", label: "设置", icon: Settings },
];

export function SideNav() {
  const active = "ap";

  return (
    <nav className="relative flex h-full w-[72px] shrink-0 flex-col items-center justify-between border-r border-line-soft/60 py-7">
      <div className="flex flex-col items-center gap-2">
        <div className="mb-6 flex h-9 w-9 items-center justify-center">
          <div className="relative h-5 w-5">
            <div className="absolute inset-0 rounded-full border border-ink-graphite/80" />
            <div className="absolute left-1/2 top-1/2 h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-gold" />
          </div>
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              title={item.label}
              className={`group relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors duration-300 ease-gentle ${
                isActive
                  ? "text-ink-main"
                  : "text-ink-faint hover:text-ink-graphite"
              }`}
            >
              {isActive && (
                <>
                  <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-accent-gold" />
                  <span className="absolute inset-1 rounded-md border border-line-soft bg-bg-soft" />
                </>
              )}
              <Icon
                size={16}
                strokeWidth={isActive ? 1.7 : 1.4}
                className="relative z-10 transition-transform duration-300 ease-gentle"
              />
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="h-7 w-7 rounded-full border border-line-soft bg-bg-deep" />
      </div>
    </nav>
  );
}
