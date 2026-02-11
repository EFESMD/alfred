"use client";

import { useDroppable } from "@dnd-kit/core";
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { TaskStatus, TaskWithAssignee } from "@/types/task";
import { KanbanCard } from "./KanbanCard";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: TaskWithAssignee[];
  onAddTask: (status: TaskStatus) => void;
  onTaskClick: (taskId: string) => void;
  isArchived?: boolean;
}

export function KanbanColumn({ 
  id, 
  title, 
  tasks, 
  onAddTask, 
  onTaskClick,
  isArchived = false
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex flex-col w-80 shrink-0 bg-slate-100/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-600">
            {title}
          </h3>
          <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-slate-500 hover:text-slate-900"
          onClick={() => onAddTask(id)}
          disabled={isArchived}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div ref={setNodeRef} className="flex-1 flex flex-col gap-3">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
