import type { APTask } from "../types/ap";
import { RawSignalPanel } from "./RawSignalPanel";
import { JudgmentSurface } from "./JudgmentSurface";
import { AIEvidencePanel } from "./AIEvidencePanel";
import { FlowStageStrip } from "./FlowStageStrip";

type APWorkspaceProps = {
  task: APTask;
  onConfirm: () => void;
};

export function APWorkspace({ task, onConfirm }: APWorkspaceProps) {
  return (
    <div className="flex h-full">
      <RawSignalPanel task={task} />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <JudgmentSurface task={task} onConfirm={onConfirm} />
        <div className="relative z-10 flex shrink-0 justify-center border-t border-line-soft/60 px-10 py-5">
          <FlowStageStrip currentStage={task.aiJudgment.currentStage} />
        </div>
      </div>

      <AIEvidencePanel task={task} />
    </div>
  );
}
