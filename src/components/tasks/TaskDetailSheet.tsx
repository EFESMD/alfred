"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  User, 
  MessageSquare, 
  History, 
  Send, 
  CalendarIcon as CalendarLucide,
  Check,
  ChevronDown,
  Paperclip,
  Trash2,
  FileIcon,
  Loader2,
  Download,
  ListTodo,
  Plus,
  GanttChart,
  Pencil,
  Sparkles
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatDistanceToNow, format, isBefore, startOfDay } from "date-fns";
import { cn, formatStatus } from "@/lib/utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TaskStatus, TaskPriority } from "@/types/task";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
interface TaskDetailSheetProps {
  taskId: string | null;
  workspaceId: string;
  projectId: string;
  onClose: () => void;
  isArchived?: boolean;
}

function RefineButton({ 
  text, 
  onRefine, 
  onApply, 
  isLoading,
  label,
  tooltip = "✨ Refine your draft for better tone, clarity, and professionalism."
}: { 
  text: string; 
  onRefine: () => void; 
  onApply: (refined: string) => void;
  isLoading: boolean;
  label?: string;
  tooltip?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [refinedText, setRefinedText] = useState<string | null>(null);

  const handleRefine = async () => {
    if (!text.trim()) return;
    try {
      const res = await fetch("/api/ai/refine-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to refine");
      const data = await res.json();
      setRefinedText(data.refinedText);
      setIsOpen(true);
    } catch (error) {
      toast.error("AI refinement failed");
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-7 px-2 text-[10px] gap-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold uppercase tracking-wider",
                  isLoading && "animate-pulse"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  handleRefine();
                }}
                disabled={isLoading || !text.trim()}
              >
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {label}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            {tooltip}
          </TooltipContent>
          <PopoverContent className="w-80 p-4 z-[110]" align="end">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Suggestion</span>
              </div>
              <div className="text-sm bg-slate-50 p-3 rounded-md border border-indigo-100 italic text-slate-700 leading-relaxed">
                "{refinedText}"
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={() => setIsOpen(false)}
                >
                  Dismiss
                </Button>
                <Button 
                  size="sm" 
                  className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => {
                    if (refinedText) onApply(refinedText);
                    setIsOpen(false);
                  }}
                >
                  Replace
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </Tooltip>
    </TooltipProvider>
  );
}

function SubtaskItem({ 
  subtask, 
  isArchived, 
  onUpdate, 
  onDelete 
}: { 
  subtask: any; 
  isArchived: boolean; 
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(subtask.title);

  useEffect(() => {
    setTitle(subtask.title);
  }, [subtask.title]);

  const handleUpdate = () => {
    setIsEditing(false);
    if (title.trim() && title !== subtask.title) {
      onUpdate(subtask.id, { title });
    } else {
      setTitle(subtask.title);
    }
  };

  return (
    <div className="flex items-center gap-3 p-1.5 px-2 hover:bg-slate-100/80 rounded-lg group transition-all min-h-[36px]">
      <button
        disabled={isArchived}
        onClick={() => onUpdate(subtask.id, { 
          status: subtask.status === "DONE" ? "PLANNED" : "DONE" 
        })}
        className={cn(
          "h-4 w-4 rounded border flex items-center justify-center transition-colors scale-90 shrink-0",
          subtask.status === "DONE" ? "bg-green-500 border-green-500" : "border-slate-300 hover:border-primary",
          isArchived && "opacity-50 cursor-not-allowed"
        )}
      >
        {subtask.status === "DONE" && <Check className="h-2.5 w-2.5 text-white" />}
      </button>
      
      {isEditing && !isArchived ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdate}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUpdate();
              if (e.key === "Escape") {
                setIsEditing(false);
                setTitle(subtask.title);
              }
            }}
            autoFocus
            className="h-7 text-xs border-slate-300 focus-visible:ring-1 bg-white"
          />
        </div>
      ) : (
        <div 
          className="flex-1 flex items-center gap-2 cursor-pointer h-full py-1"
          onClick={() => !isArchived && setIsEditing(true)}
        >
          <span 
            className={cn(
              "text-xs transition-colors break-words whitespace-normal leading-relaxed",
              subtask.status === "DONE" ? "line-through text-muted-foreground" : "text-foreground group-hover:text-primary"
            )}
          >
            {subtask.title}
          </span>
          {!isArchived && subtask.status !== "DONE" && (
            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
          )}
        </div>
      )}

      {subtask.assignee && (
        <Avatar className="h-4 w-4 shrink-0">
          <AvatarImage src={subtask.assignee.image} />
          <AvatarFallback className="text-[7px]">{subtask.assignee.name?.[0]}</AvatarFallback>
        </Avatar>
      )}
      {!isArchived && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(subtask.id);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export function TaskDetailSheet({ 
  taskId, 
  workspaceId, 
  projectId, 
  onClose,
  isArchived = false
}: TaskDetailSheetProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [comment, setComment] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [suggestedSubtasks, setSuggestedSubtasks] = useState<string[]>([]);
  const [descriptionSummary, setDescriptionSummary] = useState<string | null>(null);
  const [activitySummary, setActivitySummary] = useState<string | null>(null);
  const [refinedComment, setRefinedComment] = useState<string | null>(null);
  const [refinedDescription, setRefinedDescription] = useState<string | null>(null);

  const [isStartDateOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isDueDateOpen, setIsDueDatePopoverOpen] = useState(false);

  const { data: task, isLoading, error } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      console.log(`[TaskDetailSheet] Fetching task: ${taskId} in project: ${projectId} of workspace: ${workspaceId}`);
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`);
      if (!res.ok) {
        const text = await res.text();
        console.error(`[TaskDetailSheet] Fetch failed: ${res.status} ${text}`);
        throw new Error(text || "Failed to fetch task");
      }
      const data = await res.json();
      console.log(`[TaskDetailSheet] Successfully fetched task:`, data);
      return data;
    },
    enabled: !!taskId,
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      setIsDeleteDialogOpen(false);
      if (deletedId === taskId) {
        toast.success("Task deleted");
        onClose();
      } else {
        queryClient.invalidateQueries({ queryKey: ["task", taskId] });
        toast.success("Subtask deleted");
      }
    },
    onError: () => {
      toast.error("Failed to delete task");
    }
  });

  const { data: members } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    enabled: !!taskId,
  });

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setIsDeleteDialogOpen(false);
    }
  }, [task]);

  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["task", taskId] });
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });

      // Snapshot the previous values
      const previousTask = queryClient.getQueryData(["task", taskId]);
      const previousTasks = queryClient.getQueryData(["tasks", projectId]);

      // Optimistically update single task cache
      if (previousTask) {
        queryClient.setQueryData(["task", taskId], (old: any) => ({
          ...old,
          ...newData,
        }));
      }

      // Optimistically update list cache
      if (previousTasks) {
        queryClient.setQueryData(["tasks", projectId], (old: any[]) => {
          if (!old) return [];
          return old.map((t) => (t.id === taskId ? { ...t, ...newData } : t));
        });
      }

      return { previousTask, previousTasks };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(["task", taskId], context.previousTask);
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", projectId], context.previousTasks);
      }
      toast.error("Failed to update task");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  const createSubtaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          parentId: taskId,
          status: "PLANNED",
          priority: "MEDIUM" 
        }),
      });
      if (!res.ok) throw new Error("Failed to create subtask");
      return res.json();
    },
    onSuccess: () => {
      setSubtaskTitle("");
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("Subtask added");
    },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update subtask");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });

  const aiSuggestMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/generate-subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: task.title, 
          description: task.description,
          projectName: task.project?.name 
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "AI Generation failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setSuggestedSubtasks(data);
      toast.success("AI suggestions ready!");
    },
    onError: (error: any) => {
      toast.error(`AI failed: ${error.message}`);
    }
  });

  const addAllSubtasksMutation = useMutation({
    mutationFn: async (titles: string[]) => {
      const promises = titles.map(title => 
        fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            title, 
            parentId: taskId,
            status: "PLANNED",
            priority: "MEDIUM" 
          }),
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      setSuggestedSubtasks([]);
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("All subtasks added");
    },
  });

  const summarizeDescriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "description", 
          content: task.description 
        }),
      });
      if (!res.ok) throw new Error("Failed to summarize");
      return res.json();
    },
    onSuccess: (data) => {
      setDescriptionSummary(data.summary);
      toast.success("Description summary generated");
    },
    onError: (error: any) => {
      toast.error(`Summarization failed: ${error.message}`);
    }
  });

  const summarizeActivityMutation = useMutation({
    mutationFn: async () => {
      const feed = [
        ...task.comments.map((c: any) => `[${c.user.name}]: ${c.content}`),
        ...task.activities.map((a: any) => `[SYSTEM]: ${a.description}`)
      ].join("\n");

      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "activity", 
          content: feed 
        }),
      });
      if (!res.ok) throw new Error("Failed to summarize");
      return res.json();
    },
    onSuccess: (data) => {
      setActivitySummary(data.summary);
      toast.success("Activity summary generated");
    },
    onError: (error: any) => {
      toast.error(`Summarization failed: ${error.message}`);
    }
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/attachments`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload attachment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("Attachment uploaded");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete attachment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("Attachment deleted");
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    setIsUploading(true);
    try {
      await uploadAttachmentMutation.mutateAsync(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return res.json();
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("Comment added");
    },
  });

  if (!taskId) return null;

  const STATUS_OPTIONS: TaskStatus[] = ["PLANNED", "IN_PROGRESS", "DELAYED", "OVERDUE", "DONE"];
  const PRIORITY_OPTIONS: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[500px] p-0 flex flex-col z-[100] gap-0">
        <div className="sr-only">
          <SheetTitle>{task?.title || "Task Details"}</SheetTitle>
          <SheetDescription>View and edit task information.</SheetDescription>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-muted-foreground animate-pulse">Loading task details...</div>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="text-destructive font-medium">Failed to load task</div>
            <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["task", taskId] })}>
              Try Again
            </Button>
          </div>
        ) : !task ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2">
            <div className="font-medium text-muted-foreground">Task not found</div>
            <p className="text-sm text-muted-foreground">The task you are looking for might have been deleted or moved.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6 pt-12">
                <div className="space-y-4">
                  <div className="relative">
                    {isEditingTitle && !isArchived ? (
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={() => {
                          setIsEditingTitle(false);
                          if (title !== task.title) updateTaskMutation.mutate({ title });
                        }}
                        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                        autoFocus
                        className="text-2xl font-bold border-none px-0 focus-visible:ring-0 h-auto bg-transparent relative z-10"
                      />
                    ) : (
                      <h2 
                        className={cn(
                          "text-2xl font-bold p-1 -ml-1 rounded transition-colors",
                          !isArchived && "cursor-pointer hover:bg-slate-100"
                        )}
                        onClick={() => !isArchived && setIsEditingTitle(true)}
                      >
                        {task.title}
                      </h2>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild disabled={isArchived}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 rounded-full px-3 text-xs gap-1 relative z-50 pointer-events-auto text-foreground font-medium bg-muted/30"
                        >
                          {formatStatus(task.status)}
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      {!isArchived && (
                        <DropdownMenuContent align="start" className="z-[110]">
                          {STATUS_OPTIONS.map((status) => (
                            <DropdownMenuItem key={status} onClick={() => updateTaskMutation.mutate({ status })}>
                              <span className={cn("mr-2", task.status === status ? "opacity-100" : "opacity-0")}>
                                <Check className="h-4 w-4" />
                              </span>
                              {formatStatus(status)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      )}
                    </DropdownMenu>

                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild disabled={isArchived}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 rounded-full px-3 text-xs gap-1 relative z-50 pointer-events-auto"
                        >
                          {task.priority}
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      {!isArchived && (
                        <DropdownMenuContent align="start" className="z-[110]">
                          {PRIORITY_OPTIONS.map((priority) => (
                            <DropdownMenuItem key={priority} onClick={() => updateTaskMutation.mutate({ priority })}>
                              <span className={cn("mr-2", task.priority === priority ? "opacity-100" : "opacity-0")}>
                                <Check className="h-4 w-4" />
                              </span>
                              {priority}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      )}
                    </DropdownMenu>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="flex items-center">
                    <div className="flex items-center gap-2 text-muted-foreground w-24">
                      <Plus className="h-4 w-4" />
                      <span>Created by</span>
                    </div>
                    <div className="flex items-center gap-2 h-auto p-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.creator?.image} />
                        <AvatarFallback className="text-[10px]">
                          {task.creator?.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{task.creator?.name || "Unknown"}</span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="flex items-center gap-2 text-muted-foreground w-24">
                      <User className="h-4 w-4" />
                      <span>Assignee</span>
                    </div>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild disabled={isArchived}>
                        <Button variant="ghost" size="sm" className="h-auto p-1 hover:bg-slate-100 gap-2 relative z-50 pointer-events-auto">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={task.assignee?.image} />
                            <AvatarFallback className="text-[10px]">
                              {task.assignee?.name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{task.assignee?.name || "Unassigned"}</span>
                          {!isArchived && <ChevronDown className="h-3 w-3 opacity-50" />}
                        </Button>
                      </DropdownMenuTrigger>
                      {!isArchived && (
                        <DropdownMenuContent align="start" className="min-w-[200px] z-[110]">
                          <DropdownMenuItem onClick={() => updateTaskMutation.mutate({ assigneeId: null })}>
                            Unassigned
                          </DropdownMenuItem>
                          <Separator className="my-1" />
                          {members?.map((member: any) => (
                            <DropdownMenuItem key={member.user.id} onClick={() => updateTaskMutation.mutate({ assigneeId: member.user.id })}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={member.user.image} />
                                  <AvatarFallback className="text-[10px]">{member.user.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <span>{member.user.name}</span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      )}
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center">
                    <div className="flex items-center gap-2 text-muted-foreground w-24">
                      <CalendarLucide className="h-4 w-4" />
                      <span>Start Date</span>
                    </div>
                    <Popover open={isStartDateOpen} onOpenChange={(open) => !isArchived && setIsStartDatePopoverOpen(open)} modal={false}>
                      <PopoverTrigger asChild disabled={isArchived}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 px-2 font-medium justify-start text-left hover:bg-slate-100 relative z-50 pointer-events-auto",
                            !task.startDate && "text-muted-foreground"
                          )}
                        >
                          {task.startDate ? format(new Date(task.startDate), "PPP") : "No date"}
                          {!isArchived && <ChevronDown className="ml-2 h-3 w-3 opacity-50" />}
                        </Button>
                      </PopoverTrigger>
                      {!isArchived && (
                        <PopoverContent className="w-auto p-0 z-[110]" align="start">
                          <Calendar
                            mode="single"
                            selected={task.startDate ? new Date(task.startDate) : undefined}
                            onSelect={(date) => {
                              updateTaskMutation.mutate({ startDate: date });
                              setIsStartDatePopoverOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      )}
                    </Popover>
                  </div>

                  <div className="flex items-center">
                    <div className="flex items-center gap-2 text-muted-foreground w-24">
                      <CalendarLucide className="h-4 w-4" />
                      <span>Due Date</span>
                    </div>
                    <Popover open={isDueDateOpen} onOpenChange={(open) => !isArchived && setIsDueDatePopoverOpen(open)} modal={false}>
                      <PopoverTrigger asChild disabled={isArchived}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 px-2 font-medium justify-start text-left hover:bg-slate-100 relative z-50 pointer-events-auto",
                            task.dueDate && isBefore(startOfDay(new Date(task.dueDate)), startOfDay(new Date())) && task.status !== "DONE"
                              ? "text-red-500 font-bold"
                              : !task.dueDate 
                                ? "text-muted-foreground"
                                : "text-foreground"
                          )}
                        >
                          {task.dueDate ? format(new Date(task.dueDate), "PPP") : "No date"}
                          {!isArchived && <ChevronDown className="ml-2 h-3 w-3 opacity-50" />}
                        </Button>
                      </PopoverTrigger>
                      {!isArchived && (
                        <PopoverContent className="w-auto p-0 z-[110]" align="start">
                          <Calendar
                            mode="single"
                            selected={task.dueDate ? new Date(task.dueDate) : undefined}
                            onSelect={(date) => {
                              updateTaskMutation.mutate({ dueDate: date });
                              setIsDueDatePopoverOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      )}
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Description</h4>
                    {task.description && !isArchived && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={cn(
                                "h-7 px-2 text-[10px] gap-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold uppercase tracking-wider",
                                summarizeDescriptionMutation.isPending && "animate-pulse"
                              )}
                              onClick={() => summarizeDescriptionMutation.mutate()}
                              disabled={summarizeDescriptionMutation.isPending}
                            >
                              <Sparkles className={cn("h-3 w-3", summarizeDescriptionMutation.isPending && "animate-spin")} />
                              Summarize
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            ✨ Generate a concise summary of the task details.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  {descriptionSummary && (
                    <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs text-indigo-900 leading-relaxed relative animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI Summary
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-4 w-4 p-0 text-indigo-400 hover:text-indigo-600"
                          onClick={() => setDescriptionSummary(null)}
                        >
                          ×
                        </Button>
                      </div>
                      {descriptionSummary}
                    </div>
                  )}

                  {isEditingDescription && !isArchived ? (
                    <div className="space-y-2">
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={() => {
                          setIsEditingDescription(false);
                          if (description !== (task.description || "")) updateTaskMutation.mutate({ description });
                        }}
                        autoFocus
                        className="min-h-[100px] text-sm resize-none"
                        placeholder="Add a description..."
                      />
                      <div className="flex justify-end">
                        <RefineButton 
                          label="Refine"
                          text={description}
                          isLoading={false}
                          onRefine={() => {}} // Handled inside RefineButton
                          onApply={(refined) => {
                            setDescription(refined);
                            updateTaskMutation.mutate({ description: refined });
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div 
                      className={cn(
                        "text-sm p-2 -ml-2 rounded transition-colors min-h-[40px] whitespace-pre-wrap",
                        !isArchived && "cursor-pointer hover:bg-slate-100",
                        !task.description && "text-muted-foreground italic"
                      )}
                      onClick={() => !isArchived && setIsEditingDescription(true)}
                    >
                      {task.description || (isArchived ? "No description provided." : "No description provided. Click to add one.")}
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <ListTodo className="h-4 w-4" />
                      Subtasks
                    </h4>
                    {!isArchived && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={cn(
                                "h-8 px-2 text-[10px] gap-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold uppercase tracking-wider",
                                aiSuggestMutation.isPending && "animate-pulse"
                              )}
                              onClick={() => aiSuggestMutation.mutate()}
                              disabled={aiSuggestMutation.isPending}
                            >
                              <Sparkles className={cn("h-4 w-4", aiSuggestMutation.isPending && "animate-spin")} />
                              Suggest
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            ✨ Suggest actionable subtasks based on task title and project context.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  <div className="space-y-1">
                    {task.subtasks?.map((subtask: any) => (
                      <SubtaskItem 
                        key={subtask.id} 
                        subtask={subtask}
                        isArchived={isArchived}
                        onUpdate={(id, data) => updateSubtaskMutation.mutate({ id, ...data })}
                        onDelete={(id) => deleteTaskMutation.mutate(id)}
                      />
                    ))}

                    {/* AI Suggestions Display */}
                    {suggestedSubtasks.length > 0 && (
                      <div className="mt-4 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI Suggestions
                          </span>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
                              onClick={() => setSuggestedSubtasks([])}
                            >
                              Dismiss
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-[10px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
                              onClick={() => addAllSubtasksMutation.mutate(suggestedSubtasks)}
                              disabled={addAllSubtasksMutation.isPending}
                            >
                              {addAllSubtasksMutation.isPending ? "Adding..." : "Add All"}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {suggestedSubtasks.map((title, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 bg-white/50 p-1.5 rounded border border-indigo-50">
                              <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                              {title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isArchived && (
                      <div className="flex items-center gap-2 p-1 pl-0">
                        <Plus className="h-4 w-4 text-muted-foreground ml-0.5" />
                        <Input
                          placeholder="Add a subtask..."
                          value={subtaskTitle}
                          onChange={(e) => setSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && subtaskTitle.trim()) {
                              createSubtaskMutation.mutate(subtaskTitle);
                            }
                          }}
                          className="h-8 text-sm border-none shadow-none focus-visible:ring-0 px-0 bg-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Attachments
                    </h4>
                    {!isArchived && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs gap-1"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
                        Attach
                      </Button>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {task.attachments?.map((attachment: any) => (
                      <div 
                        key={attachment.id} 
                        className="flex items-center justify-between p-2 border rounded-lg bg-slate-50/50 group hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-white rounded border">
                            <FileIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{attachment.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {(attachment.size / 1024).toFixed(1)} KB • {format(new Date(attachment.createdAt), "MMM d")}
                            </p>
                          </div>
                        </div>
                        <div className={cn(
                          "flex items-center gap-1 transition-opacity",
                          !isArchived ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                        )}>
                          <a 
                            href={attachment.url} 
                            download={attachment.name}
                            className="p-1 hover:bg-slate-200 rounded text-muted-foreground"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          {!isArchived && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!task.attachments || task.attachments.length === 0) && (
                      <p className="text-xs text-muted-foreground italic text-center py-2 bg-slate-50/50 rounded-lg border border-dashed">
                        No attachments yet
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col">
                  <div className="flex items-center justify-between py-3 bg-slate-50 -mx-6 px-6 border-y">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Activity & Comments</span>
                    </div>
                    {(task.comments?.length > 0 || task.activities?.length > 0) && !isArchived && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={cn(
                                "h-7 px-2 text-[10px] gap-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold uppercase tracking-wider",
                                summarizeActivityMutation.isPending && "animate-pulse"
                              )}
                              onClick={() => summarizeActivityMutation.mutate()}
                              disabled={summarizeActivityMutation.isPending}
                            >
                              <Sparkles className={cn("h-3 w-3", summarizeActivityMutation.isPending && "animate-spin")} />
                              Digest
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            ✨ Generate a concise summary of the task details and recent activity.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  {activitySummary && (
                    <div className="mt-4 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs text-indigo-900 leading-relaxed animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-indigo-100">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" />
                          Activity Digest
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-4 w-4 p-0 text-indigo-400 hover:text-indigo-600"
                          onClick={() => setActivitySummary(null)}
                        >
                          ×
                        </Button>
                      </div>
                      <div className="whitespace-pre-wrap">
                        {activitySummary}
                      </div>
                    </div>
                  )}

                  <div className="space-y-6 pt-6 pb-6">
                    {(() => {
                      const feed = [
                        ...task.comments.map((c: any) => ({ ...c, isComment: true })),
                        ...task.activities.map((a: any) => ({ ...a, isActivity: true }))
                      ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

                      return feed.map((item: any) => {
                        if (item.isComment) {
                          return (
                            <div key={item.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={item.user.image} />
                                <AvatarFallback>{item.user.name?.[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">{item.user.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                                <div className="text-sm bg-white border rounded-lg p-3 shadow-sm">
                                  {item.content}
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div key={item.id} className="flex items-start gap-3 text-xs text-muted-foreground pl-11">
                              {item.type === "TASK_CREATED" ? (
                                <Plus className="h-3 w-3 mt-0.5 shrink-0 text-primary font-bold" />
                              ) : (
                                <History className="h-3 w-3 mt-0.5 shrink-0" />
                              )}
                              <div className="flex flex-col gap-0.5">
                                <span>
                                  <span className="font-medium text-foreground">{item.user.name}</span>{" "}
                                  {item.description}
                                </span>
                                <span className="text-[10px] opacity-70">
                                  {format(new Date(item.createdAt), "d MMM yyyy HH:mm")}
                                </span>
                              </div>
                            </div>
                          );
                        }
                      });
                    })()}
                  </div>
                </div>

                {!isArchived && (
                  <>
                    <Separator />
                    <div className="pt-4 pb-2">
                      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete Task
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="z-[120]">
                          <DialogHeader>
                            <DialogTitle>Are you absolutely sure?</DialogTitle>
                            <DialogDescription>
                              This action cannot be undone. This will permanently delete the task
                              "{task.title}" and remove its data from our servers.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                            <Button 
                              variant="destructive" 
                              onClick={() => deleteTaskMutation.mutate(task.id)}
                              disabled={deleteTaskMutation.isPending}
                            >
                              {deleteTaskMutation.isPending ? "Deleting..." : "Delete Task"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!isArchived && (
              <div className="p-4 border-t bg-white shrink-0">
                <div className="flex gap-2">
                  <Textarea 
                    placeholder="Write a comment..." 
                    className="min-h-[80px]"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <div className="flex justify-end items-center mt-2 gap-2">
                  <RefineButton 
                    label="Refine"
                    text={comment}
                    isLoading={false}
                    onRefine={() => {}}
                    onApply={(refined) => setComment(refined)}
                  />
                  <Button 
                    size="sm" 
                    disabled={!comment.trim() || addCommentMutation.isPending}
                    onClick={() => addCommentMutation.mutate(comment)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Comment
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
