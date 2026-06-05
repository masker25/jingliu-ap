import type { ReactNode } from "react";
import { SideNav } from "./SideNav";
import { TopHeader } from "./TopHeader";

type AppShellProps = {
  entityName: string;
  workspace: ReactNode;
  filmstrip: ReactNode;
};

export function AppShell({ entityName, workspace, filmstrip }: AppShellProps) {
  return (
    <div className="grain-bg flex h-screen min-h-[760px] w-screen overflow-hidden text-ink-main">
      <SideNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopHeader entityName={entityName} />
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="relative flex-1 overflow-hidden">{workspace}</div>
          <div className="shrink-0 border-t border-line-soft/70 bg-bg-soft/40">
            {filmstrip}
          </div>
        </main>
      </div>
    </div>
  );
}
