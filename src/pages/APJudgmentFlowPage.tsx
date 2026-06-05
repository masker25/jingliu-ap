import { useCallback, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { APWorkspace } from "../components/APWorkspace";
import { TaskFilmstrip } from "../components/TaskFilmstrip";
import { mockApTasks } from "../data/mockApTasks";
import type { APTask } from "../types/ap";

export function APJudgmentFlowPage() {
  const [tasks, setTasks] = useState<APTask[]>(mockApTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(mockApTasks[0].id);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? tasks[0],
    [tasks, selectedTaskId],
  );

  const handleConfirmCurrentTask = useCallback(() => {
    const currentId = selectedTaskId;

    const nextTasks: APTask[] = tasks.map((task) =>
      task.id === currentId
        ? {
            ...task,
            status: "completed",
            aiJudgment: {
              ...task.aiJudgment,
              currentStage: "confirmed",
              statusLine: "已确认 · 已入账 · 可追溯",
            },
          }
        : task,
    );

    setTasks(nextTasks);

    const nextTask = nextTasks.find(
      (task) => task.id !== currentId && task.status !== "completed",
    );

    if (nextTask) {
      setSelectedTaskId(nextTask.id);
    }
  }, [selectedTaskId, tasks]);

  return (
    <AppShell
      entityName={selectedTask.entity}
      workspace={
        <APWorkspace task={selectedTask} onConfirm={handleConfirmCurrentTask} />
      }
      filmstrip={
        <TaskFilmstrip
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
        />
      }
    />
  );
}
