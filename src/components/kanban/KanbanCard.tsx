"use client";

import { isBefore, startOfDay } from "date-fns";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskPriority, TaskStatus, TaskWithAssignee } from "@/types/task";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface KanbanCardProps {
  task: TaskWithAssignee;
  onClick?: () => void;
  onStatusChange?: (status: TaskStatus) => void;
  isArchived?: boolean;
}

export function KanbanCard({ task, onClick, onStatusChange, isArchived }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isArchived });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "LOW": return "bg-blue-50 text-blue-600 border-blue-100";
      case "MEDIUM": return "bg-yellow-50 text-yellow-600 border-yellow-100";
      case "HIGH": return "bg-red-50 text-red-600 border-red-100";
      default: return "";
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={onClick}
    >
      <Card className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors shadow-sm relative group">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-start gap-2">
            {!isArchived && onStatusChange && (
              <div 
                className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Checkbox 
                  checked={task.status === "DONE"}
                  onCheckedChange={(checked) => onStatusChange(checked ? "DONE" : "TODO")}
                  className="h-3.5 w-3.5"
                />
              </div>
            )}
            <h4 className={cn("text-sm font-medium leading-tight", task.status === "DONE" && "line-through text-muted-foreground")}>{task.title}</h4>
          </div>
          
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getPriorityColor(task.priority as TaskPriority)}`}>
                {task.priority}
              </Badge>
              {task.dueDate && (
                <div className={cn(
                  "flex items-center gap-1 text-[10px]",
                  isBefore(startOfDay(new Date(task.dueDate)), startOfDay(new Date())) && task.status !== "DONE"
                    ? "text-red-500 font-medium"
                    : "text-muted-foreground"
                )}>
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            <Avatar className="h-5 w-5">
              {task.assignee?.image && <AvatarImage src={task.assignee.image} />}
              <AvatarFallback className="text-[10px]">
                {task.assignee?.name?.[0] || <User className="h-2 w-2" />}
              </AvatarFallback>
            </Avatar>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
