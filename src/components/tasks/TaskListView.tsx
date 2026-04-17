"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Calendar, User, ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isBefore, startOfDay } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskModal } from "@/components/tasks/TaskModal";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { TaskStatus, TaskPriority, TaskWithAssignee } from "@/types/task";
import { cn, formatStatus } from "@/lib/utils";
import { useRealtime } from "@/hooks/use-realtime";
import { useTaskFilter } from "@/hooks/use-task-filter";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Section {
  id: string;
  name: string;
  order: number;
}

interface TaskListViewProps {
  workspaceId: string;
  projectId: string;
  isArchived?: boolean;
  projectLeaderId?: string | null;
}

function SortableTaskRow({ 
  task, 
  onClick, 
  onStatusChange,
  getStatusColor, 
  getPriorityColor,
  disabled = false
}: { 
  task: TaskWithAssignee; 
  onClick: () => void;
  onStatusChange: (status: TaskStatus) => void;
  getStatusColor: (s: any) => string;
  getPriorityColor: (p: any) => string;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow 
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="cursor-pointer group h-9"
      onClick={onClick}
    >
      <TableCell className="w-[30px] pl-3 pr-0 py-1" onClick={(e) => e.stopPropagation()}>
        {!disabled && (
          <div {...listeners} className="cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <MoreHorizontal className="h-3.5 w-3.5 rotate-90 text-muted-foreground" />
          </div>
        )}
      </TableCell>
      <TableCell className="w-[30px] px-0 py-1" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center h-full">
          <Checkbox 
            checked={task.status === "DONE"}
            onCheckedChange={(checked) => {
              onStatusChange(checked ? "DONE" : "TODO");
            }}
            disabled={disabled}
            className="h-4 w-4"
          />
        </div>
      </TableCell>
      <TableCell className="font-medium pl-2 py-1">
        <div className="flex items-center gap-2 h-full">
          <span className={cn("truncate", task.status === "DONE" && "line-through text-muted-foreground")}>{task.title}</span>
          {(task.subtasks?.length ?? 0) > 0 && (
            <Badge variant="outline" className="text-[9px] px-1 h-3.5 gap-1 opacity-50 font-normal">
              {task.subtasks?.length} subtasks
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="py-1">
        <div className="flex items-center gap-2 scale-90 origin-left">
          <Avatar className="h-5 w-5">
            {task.assignee?.image && <AvatarImage src={task.assignee.image} />}
            <AvatarFallback className="text-[9px]">
              {task.assignee?.name?.[0] || <User className="h-2.5 w-2.5" />}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs truncate max-w-[100px]">
            {task.assignee?.name || "Unassigned"}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-1">
        <div className={cn(
          "flex items-center gap-1.5 text-xs",
          task.dueDate && isBefore(startOfDay(new Date(task.dueDate)), startOfDay(new Date())) && task.status !== "DONE"
            ? "text-red-500 font-medium"
            : task.dueDate 
              ? "text-foreground" 
              : "text-muted-foreground"
        )}>
          <Calendar className="h-3.5 w-3.5" />
          <span>{task.dueDate ? format(new Date(task.dueDate), "MMM d") : "No date"}</span>
        </div>
      </TableCell>
      <TableCell className="py-1">
        <Badge variant="outline" className={cn("text-[10px] py-0 h-5", getPriorityColor(task.priority as TaskPriority))}>
          {task.priority}
        </Badge>
      </TableCell>
      <TableCell className="py-1">
        <Badge className={cn("text-[10px] py-0 h-5", getStatusColor(task.status as TaskStatus))}>
          {formatStatus(task.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-right py-1">
        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-7 w-7">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function TaskListView({ workspaceId, projectId, isArchived = false }: TaskListViewProps) {
  useRealtime(projectId);
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Check for taskId in query params on mount
  useEffect(() => {
    const taskId = searchParams.get("taskId");
    if (taskId) {
      setSelectedTaskId(taskId);
    }
  }, [searchParams]);

  const [initialSectionId, setInitialSectionId] = useState<string | undefined>(undefined);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState("");
  const [inlineSectionId, setInlineSectionId] = useState<string | null>(null);
  const [inlineTitle, setInlineTitle] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
  });

  const userRole = project?.currentUserRole || "VIEWER";

  const isReadOnly = isArchived || userRole === "VIEWER";
  const canManageStructure = userRole === "OWNER" || userRole === "MEMBER";

  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useQuery<TaskWithAssignee[]>({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const { filteredTasks } = useTaskFilter(tasks);

  const { data: sections, isLoading: sectionsLoading, refetch: refetchSections } = useQuery({
    queryKey: ["sections", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/sections`);
      if (!res.ok) throw new Error("Failed to fetch sections");
      return res.json();
    },
  });

  const addSectionMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create section");
      return res.json();
    },
    onSuccess: () => {
      setIsAddingSection(false);
      setNewSectionName("");
      refetchSections();
      toast.success("Section created");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, sectionId, status, priority }: { id: string; sectionId?: string | null; status?: TaskStatus; priority?: TaskPriority }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, status, priority }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    }
  });

  const allSections = useMemo(() => {
    const list = [...((sections as Section[]) || [])];
    list.push({ id: "uncategorized", name: "Uncategorized", order: 999 });
    return list;
  }, [sections]);

  // Initialize active section
  React.useEffect(() => {
    if (allSections.length > 0 && !activeSectionId) {
      setActiveSectionId(allSections[0].id);
    }
  }, [allSections, activeSectionId]);

  const createTaskMutation = useMutation({
    mutationFn: async ({ title, sectionId }: { title: string; sectionId?: string }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          sectionId: sectionId === "uncategorized" ? null : sectionId,
          status: "TODO",
          priority: "MEDIUM",
          assigneeId: project?.projectLeaderId
        }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      setInlineTitle("");
      setInlineSectionId(null);
      refetchTasks();
      toast.success("Task created");
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const endpoint = id === "uncategorized" 
        ? `/api/workspaces/${workspaceId}/projects/${projectId}/sections/promote-uncategorized`
        : `/api/workspaces/${workspaceId}/projects/${projectId}/sections/${id}`;
      
      const method = id === "uncategorized" ? "POST" : "PATCH";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to update section");
      return res.json();
    },
    onSuccess: (newSection) => {
      setEditingSectionId(null);
      if (activeSectionId === "uncategorized") {
        setActiveSectionId(newSection.id);
      }
      refetchSections();
      refetchTasks();
      toast.success("Section updated");
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/sections/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete section");
    },
    onSuccess: () => {
      if (activeSectionId && !allSections.find(s => s.id === activeSectionId)) {
        setActiveSectionId(allSections[0].id);
      }
      refetchSections();
      refetchTasks();
      toast.success("Section deleted");
    },
  });

  const groupedTasks = useMemo(() => {
    if (!filteredTasks) return {};
    const groups: Record<string, TaskWithAssignee[]> = { "uncategorized": [] };
    
    (sections as Section[])?.forEach(s => groups[s.id] = []);
    
    filteredTasks.forEach(task => {
      const key = task.sectionId || "uncategorized";
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    
    return groups;
  }, [filteredTasks, sections]);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  // Keyboard shortcut listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isReadOnly) return;

      const isTyping = 
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable;

      if (isTyping) {
        if (e.key === "Escape") {
          (e.target as HTMLElement).blur();
          setInlineSectionId(null);
          setIsAddingSection(false);
          setEditingSectionId(null);
        }
        return;
      }

      const key = e.key.toLowerCase();

      // Open Modal
      if (key === 't') {
        e.preventDefault();
        setInitialSectionId(activeSectionId || undefined);
        setIsModalOpen(true);
      }

      // Inline Add
      if (key === 'n') {
        e.preventDefault();
        if (activeSectionId) {
          setInlineSectionId(activeSectionId);
          setCollapsedSections(prev => ({ ...prev, [activeSectionId]: false }));
        }
      }

      // Navigation
      if (key === 'j' || key === 'k') {
        e.preventDefault();
        const currentIndex = allSections.findIndex(s => s.id === activeSectionId);
        let nextIndex = currentIndex;

        if (key === 'j') { // Down
          nextIndex = (currentIndex + 1) % allSections.length;
        } else { // Up
          nextIndex = (currentIndex - 1 + allSections.length) % allSections.length;
        }

        const nextSection = allSections[nextIndex];
        if (nextSection) {
          setActiveSectionId(nextSection.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReadOnly, activeSectionId, allSections]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (isReadOnly) return;
    
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Detect if dropped over a section row or another task
    let targetSectionId = overId;
    
    // Find task being dragged
    const draggedTask = tasks?.find(t => t.id === taskId);
    if (!draggedTask) return;

    // If dropped over another task, get that task's section
    const overTask = tasks?.find(t => t.id === overId);
    if (overTask) {
      targetSectionId = overTask.sectionId || "uncategorized";
    }

    if (draggedTask.sectionId !== (targetSectionId === "uncategorized" ? null : targetSectionId)) {
      updateTaskMutation.mutate({ 
        id: taskId, 
        sectionId: targetSectionId === "uncategorized" ? "uncategorized" : targetSectionId 
      });
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "BACKLOG": return "bg-slate-500";
      case "TODO": return "bg-blue-600";
      case "IN_PROGRESS": return "bg-amber-500";
      case "DONE": return "bg-emerald-600";
      default: return "bg-slate-500";
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "LOW": return "text-primary/80 bg-primary/10 border-primary/20";
      case "MEDIUM": return "text-amber-700 bg-amber-50 border-amber-200";
      case "HIGH": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-slate-500 bg-slate-50";
    }
  };

  if (tasksLoading || sectionsLoading || projectLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading project data...</div>;

  return (
    <div className="p-6">
      {!isReadOnly && (
        <div className="flex items-center gap-3 mb-6">
          <Button 
            onClick={() => {
              setInitialSectionId(activeSectionId || undefined);
              setIsModalOpen(true);
            }} 
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
          {canManageStructure && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddingSection(true)}
            >
              Add Section
            </Button>
          )}
        </div>
      )}

      {isAddingSection && !isReadOnly && (
        <div className="mb-4 flex items-center gap-2 p-2 bg-slate-50 rounded-md border border-dashed">
          <Input 
            placeholder="Section name..." 
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newSectionName.trim()) addSectionMutation.mutate(newSectionName);
              if (e.key === "Escape") setIsAddingSection(false);
            }}
            autoFocus
            className="h-8 max-w-[300px]"
          />
          <Button size="sm" onClick={() => addSectionMutation.mutate(newSectionName)} disabled={!newSectionName.trim()}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAddingSection(false)}>Cancel</Button>
        </div>
      )}

      <div className="bg-white rounded-md border overflow-hidden">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[30px]"></TableHead>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead className="w-[40%]">Task name</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allSections.map((section) => {
                const sectionTasks = groupedTasks[section.id] || [];
                if (section.id === "uncategorized" && sectionTasks.length === 0) return null;
                
                const isCollapsed = collapsedSections[section.id];
                const isEditing = editingSectionId === section.id;
                const isActive = activeSectionId === section.id;
                
                return (
                  <React.Fragment key={section.id}>
                    <TableRow 
                      id={section.id}
                      className={cn(
                        "bg-muted/30 hover:bg-muted/50 group transition-all duration-200",
                        isActive && "bg-accent ring-1 ring-primary/20 ring-inset"
                      )}
                      onClick={() => setActiveSectionId(section.id)}
                    >
                      <TableCell colSpan={8} className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground relative">
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md" />
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSection(section.id);
                              }}
                              className="hover:bg-slate-200 p-0.5 rounded transition-colors"
                            >
                              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            
                            {isEditing && canManageStructure ? (
                              <Input 
                                value={editingSectionName}
                                onChange={(e) => setEditingSectionName(e.target.value)}
                                className="h-7 max-w-[250px] text-xs font-semibold uppercase py-0 px-2"
                                autoFocus
                                onBlur={() => {
                                  if (editingSectionName.trim() && editingSectionName !== section.name) {
                                    updateSectionMutation.mutate({ id: section.id, name: editingSectionName });
                                  } else {
                                    setEditingSectionId(null);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    updateSectionMutation.mutate({ id: section.id, name: editingSectionName });
                                  }
                                  if (e.key === "Escape") setEditingSectionId(null);
                                }}
                              />
                            ) : (
                              <>
                                <span>{section.name}</span>
                                <span className="ml-2 font-normal lowercase opacity-50">({sectionTasks.length})</span>
                              </>
                            )}
                          </div>

                          {!isReadOnly && canManageStructure && !isEditing && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setEditingSectionId(section.id);
                                  setEditingSectionName(section.id === "uncategorized" ? "" : section.name);
                                }}>
                                  <Pencil className="h-3 w-3 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                {section.id !== "uncategorized" && (
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => {
                                      if (confirm("Are you sure? Tasks in this section will be moved to Uncategorized.")) {
                                        deleteSectionMutation.mutate(section.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {!isCollapsed && (
                      <SortableContext 
                        items={sectionTasks.map(t => t.id)} 
                        strategy={verticalListSortingStrategy}
                      >
                        {sectionTasks.map((task) => (
                          <SortableTaskRow 
                            key={task.id} 
                            task={task} 
                            onClick={() => setSelectedTaskId(task.id)}
                            onStatusChange={(status) => updateTaskMutation.mutate({ id: task.id, sectionId: task.sectionId, status })}
                            getStatusColor={getStatusColor}
                            getPriorityColor={getPriorityColor}
                            disabled={isReadOnly}
                          />
                        ))}
                      </SortableContext>
                    )}

                    {!isCollapsed && !isReadOnly && (
                      <TableRow className="hover:bg-transparent h-8">
                        <TableCell colSpan={8} className="py-1 pl-10">
                          {inlineSectionId === section.id ? (
                            <div className="flex items-center gap-2 pr-4">
                              <Input 
                                placeholder="Task name..." 
                                value={inlineTitle}
                                onChange={(e) => setInlineTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && inlineTitle.trim()) {
                                    createTaskMutation.mutate({ title: inlineTitle, sectionId: section.id });
                                  }
                                  if (e.key === "Escape") {
                                    setInlineSectionId(null);
                                    setInlineTitle("");
                                  }
                                }}
                                autoFocus
                                className="h-7 text-xs border-none shadow-none focus-visible:ring-1 bg-muted/50"
                              />
                              <Button 
                                size="sm" 
                                className="h-6 text-[10px] px-2" 
                                onClick={() => createTaskMutation.mutate({ title: inlineTitle, sectionId: section.id })}
                                disabled={!inlineTitle.trim() || createTaskMutation.isPending}
                              >
                                Add
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 text-[10px] px-2"
                                onClick={() => {
                                  setInlineSectionId(null);
                                  setInlineTitle("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <button 
                              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors group/btn"
                              onClick={() => setInlineSectionId(section.id)}
                            >
                              <Plus className="h-3 w-3 group-hover/btn:scale-110 transition-transform" />
                              Add task to {section.name}
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setInitialSectionId(undefined);
        }}
        workspaceId={workspaceId}
        projectId={projectId}
        initialSectionId={initialSectionId}
        onSuccess={refetchTasks}
      />

      <TaskDetailSheet 
        taskId={selectedTaskId}
        workspaceId={workspaceId}
        projectId={projectId}
        onClose={() => setSelectedTaskId(null)}
        isArchived={isReadOnly}
      />
    </div>
  );
}
