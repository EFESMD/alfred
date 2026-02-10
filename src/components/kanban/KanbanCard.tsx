"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskPriority, TaskWithAssignee } from "@/types/task";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface KanbanCardProps {
  task: TaskWithAssignee;
  onClick?: () => void;
}

export function KanbanCard({ task, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

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
      <Card className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors shadow-sm">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
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
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
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
