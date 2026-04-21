"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { TaskStatus, TaskPriority } from "@/types/task";

import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Sparkles, Wand2, Loader2 } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  projectId: string;
  onSuccess: () => void;
  initialStatus?: TaskStatus;
  initialSectionId?: string;
}

export function TaskModal({ 
  isOpen, 
  onClose, 
  workspaceId, 
  projectId,
  onSuccess,
  initialStatus = "PLANNED",
  initialSectionId
}: TaskModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: initialStatus,
    priority: "MEDIUM" as TaskPriority,
    assigneeId: undefined as string | undefined,
    startDate: undefined as Date | undefined,
    dueDate: undefined as Date | undefined,
    sectionId: initialSectionId,
  });

  const [parsedPreview, setParsedPreview] = useState<any | null>(null);

  const aiParseMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await fetch("/api/ai/parse-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, currentDate: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Parsing failed");
      return res.json();
    },
    onSuccess: (data) => {
      setParsedPreview(data);
    },
  });

  const handleApplyAI = () => {
    if (!parsedPreview) return;
    
    setFormData(prev => ({
      ...prev,
      title: parsedPreview.title || prev.title,
      description: parsedPreview.description || prev.description,
      status: (parsedPreview.status as TaskStatus) || prev.status,
      priority: (parsedPreview.priority as TaskPriority) || prev.priority,
      startDate: parsedPreview.startDate ? new Date(parsedPreview.startDate) : prev.startDate,
      dueDate: parsedPreview.dueDate ? new Date(parsedPreview.dueDate) : prev.dueDate,
    }));
    
    // If an assignee name was detected, try to find a matching member
    if (parsedPreview.assigneeName && members) {
      const match = members.find((m: any) => 
        m.user.name?.toLowerCase().includes(parsedPreview.assigneeName.toLowerCase())
      );
      if (match) {
        setFormData(prev => ({ ...prev, assigneeId: match.user.id }));
      }
    }
    
    setParsedPreview(null);
    toast.success("AI suggestions applied! Review and click Create Task.");
  };

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
    enabled: isOpen,
  });

  // Update status, section and default assignee when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        status: initialStatus,
        sectionId: initialSectionId,
        assigneeId: prev.assigneeId || project?.projectLeaderId || undefined
      }));
    }
  }, [initialStatus, initialSectionId, isOpen, project?.projectLeaderId]);

  const [isStartDateOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isDueDateOpen, setIsDueDatePopoverOpen] = useState(false);

  const { data: members } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    enabled: isOpen,
  });

  const { data: sections } = useQuery({
    queryKey: ["sections", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/sections`);
      if (!res.ok) throw new Error("Failed to fetch sections");
      return res.json();
    },
    enabled: isOpen,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to create task");
      }

      toast.success("Task created!");
      onSuccess();
      onClose();
      setFormData({
       title: "",
       description: "",
       status: initialStatus,
       priority: "MEDIUM",
       assigneeId: project?.projectLeaderId || undefined,
       startDate: undefined,
       dueDate: undefined,
       sectionId: undefined,
      });    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Title</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1 text-[10px] font-bold uppercase tracking-wider"
                      onClick={() => aiParseMutation.mutate(formData.title)}
                      disabled={!formData.title.trim() || aiParseMutation.isPending}
                    >
                      {aiParseMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Magic Parse
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    ✨ Type naturally (e.g., "Meet Victor tomorrow at 2pm") and click to automatically set dates and details.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="title"
              placeholder="E.g., Call Victor tomorrow at 10am"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={cn(aiParseMutation.isPending && "animate-pulse border-indigo-200")}
            />
          </div>

          {parsedPreview && (
            <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center justify-between group animate-in zoom-in-95 duration-200">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                  <Wand2 className="h-3 w-3" />
                  AI Preview
                </p>
                <div className="text-xs text-indigo-900 font-medium">
                  {parsedPreview.title} 
                  {parsedPreview.startDate && <span className="text-indigo-500 ml-1">• {format(new Date(parsedPreview.startDate), "MMM d, HH:mm")}</span>}
                  {parsedPreview.priority && <span className="text-indigo-400 ml-1">• {parsedPreview.priority}</span>}
                </div>
              </div>
              <Button 
                type="button"
                size="sm" 
                className="h-7 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs px-3"
                onClick={handleApplyAI}
              >
                Apply
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Task description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select 
              value={formData.assigneeId} 
              onValueChange={(value) => setFormData({ ...formData, assigneeId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                {members?.map((member: any) => (
                  <SelectItem key={member.user.id} value={member.user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={member.user.image} />
                        <AvatarFallback>{member.user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span>{member.user.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover open={isStartDateOpen} onOpenChange={setIsStartDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => {
                      setFormData({ ...formData, startDate: date });
                      setIsStartDatePopoverOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover open={isDueDateOpen} onOpenChange={setIsDueDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => {
                      setFormData({ ...formData, dueDate: date });
                      setIsDueDatePopoverOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DELAYED">Delayed</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
