"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Wand2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  projectId: string;
}

interface ExtractedTask {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
}

export function TaskExtractionModal({ 
  isOpen, 
  onClose, 
  workspaceId, 
  projectId 
}: TaskExtractionModalProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const extractMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch("/api/ai/extract-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, currentDate: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Extraction failed");
      return res.json();
    },
    onSuccess: (data) => {
      setExtractedTasks(data.tasks);
      setSelectedIndices(data.tasks.map((_: any, i: number) => i));
      toast.success(`Extracted ${data.tasks.length} tasks!`);
    },
    onError: (error: any) => {
      toast.error(`AI failed: ${error.message}`);
    }
  });

  const importMutation = useMutation({
    mutationFn: async (tasks: ExtractedTask[]) => {
      const promises = tasks.map(task => 
        fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            ...task,
            status: "PLANNED",
          }),
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Tasks imported successfully!");
      handleClose();
    },
    onError: (error: any) => {
      toast.error(`Import failed: ${error.message}`);
    }
  });

  const handleClose = () => {
    setContent("");
    setExtractedTasks([]);
    setSelectedIndices([]);
    onClose();
  };

  const toggleTask = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Extract Tasks from Notes
          </DialogTitle>
          <DialogDescription>
            Paste your meeting notes or transcript below. Alfred will automatically find and extract actionable tasks for you.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-6 pt-2 space-y-4">
          {extractedTasks.length === 0 ? (
            <div className="space-y-4 flex-1 flex flex-col">
              <Textarea
                placeholder="Paste notes here... (e.g., 'In today's meeting we decided that Victor will update the API by Friday...')"
                className="flex-1 min-h-[300px] resize-none border-indigo-100 focus-visible:ring-indigo-500"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <Button 
                onClick={() => extractMutation.mutate(content)}
                disabled={!content.trim() || extractMutation.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-11"
              >
                {extractMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Analyze and Extract Tasks
              </Button>
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground bg-indigo-50/50 p-2 rounded-md border border-indigo-100">
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Select tasks to import
                </span>
                <span>{selectedIndices.length} of {extractedTasks.length} selected</span>
              </div>
              
              <ScrollArea className="flex-1 border rounded-md p-4">
                <div className="space-y-4">
                  {extractedTasks.map((task, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-slate-50",
                        selectedIndices.includes(idx) ? "border-indigo-200 bg-indigo-50/30 shadow-sm" : "border-slate-100 opacity-60"
                      )}
                      onClick={() => toggleTask(idx)}
                    >
                      <Checkbox 
                        checked={selectedIndices.includes(idx)} 
                        onCheckedChange={() => toggleTask(idx)}
                        className="mt-1 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900 leading-none">{task.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border",
                            task.priority === "HIGH" ? "bg-red-50 text-red-600 border-red-100" :
                            task.priority === "MEDIUM" ? "bg-amber-50 text-amber-600 border-amber-100" :
                            "bg-blue-50 text-blue-600 border-blue-100"
                          )}>
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setExtractedTasks([])}
                >
                  Back to Editor
                </Button>
                <Button 
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                  disabled={selectedIndices.length === 0 || importMutation.isPending}
                  onClick={() => importMutation.mutate(extractedTasks.filter((_, i) => selectedIndices.includes(i)))}
                >
                  {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Import {selectedIndices.length} {selectedIndices.length === 1 ? "Task" : "Tasks"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
