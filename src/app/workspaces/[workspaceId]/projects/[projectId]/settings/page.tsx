"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Archive, Trash2, RotateCcw, Plus, Users, ShieldCheck, Eye, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>;
}) {
  const { workspaceId, projectId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectLeaderId, setProjectLeaderId] = useState<string | undefined>(undefined);
  const [color, setColor] = useState<string | undefined>(undefined);
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("general");

  const COLORS = [
    { name: "Blue", value: "bg-blue-50 border-blue-100 text-blue-600" },
    { name: "Red", value: "bg-red-50 border-red-100 text-red-600" },
    { name: "Green", value: "bg-green-50 border-green-100 text-green-600" },
    { name: "Yellow", value: "bg-yellow-50 border-yellow-100 text-yellow-600" },
    { name: "Purple", value: "bg-purple-50 border-purple-100 text-purple-600" },
    { name: "Pink", value: "bg-pink-50 border-pink-100 text-pink-600" },
    { name: "Indigo", value: "bg-indigo-50 border-indigo-100 text-indigo-600" },
    { name: "Slate", value: "bg-slate-50 border-slate-100 text-slate-600" },
  ];

  const ICONS = ["📁", "🚀", "📊", "💡", "🛠️", "🎨", "📣", "🔒", "🌐", "📱"];

  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ["project-settings", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      return response.json();
    },
  });

  const { data: workspaceMembers } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
  });

  const { data: projectMembers, isLoading: isMembersLoading } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/members`);
      if (!res.ok) throw new Error("Failed to fetch project members");
      return res.json();
    },
  });

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setProjectLeaderId(project.projectLeaderId);
      setColor(project.color || COLORS[0].value);
      setIcon(project.icon || "📁");
    }
  }, [project]);

  const updateProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update project");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Project updated!");
      queryClient.invalidateQueries({ queryKey: ["project-settings", projectId] });
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
    },
    onSuccess: () => {
      toast.success("Project deleted");
      router.push(`/workspaces/${workspaceId}`);
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to add member");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Member added to project!");
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string, role: string }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Role updated!");
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/members/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to remove member");
      }
    },
    onSuccess: () => {
      toast.success("Member removed from project");
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const duplicateAsTemplateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${project.name} (Template)`, isTemplate: true }),
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Project saved as template!");
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleSave = () => {
    updateProjectMutation.mutate({ name, description, projectLeaderId, color, icon });
  };

  const handleToggleArchive = () => {
    updateProjectMutation.mutate({ isArchived: !project.isArchived });
  };

  // Filter workspace members that are not already in the project
  const availableMembers = workspaceMembers?.filter((wm: any) => 
    !projectMembers?.some((pm: any) => pm.userId === wm.user.id)
  ) || [];

  if (isProjectLoading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Project Settings</h1>
        <p className="text-muted-foreground text-sm">Manage project details, access, and status.</p>
      </div>

      <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members & Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Update your project name and description.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Marketing Campaign"
                  disabled={project?.isArchived}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this project about?"
                  rows={4}
                  disabled={project?.isArchived}
                />
              </div>
              <div className="space-y-2">
                <Label>Project Leader</Label>
                <Select 
                  value={projectLeaderId} 
                  onValueChange={setProjectLeaderId}
                  disabled={project?.isArchived}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project leader" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaceMembers?.map((member: any) => (
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-3">
                  <Label>Project Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => !project?.isArchived && setColor(c.value)}
                        disabled={project?.isArchived}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          c.value,
                          color === c.value ? "border-black scale-110 shadow-sm" : "border-transparent",
                          !project?.isArchived ? "hover:scale-105" : "opacity-50 cursor-not-allowed"
                        )}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Project Icon</Label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map((i) => (
                      <button
                        key={i}
                        onClick={() => !project?.isArchived && setIcon(i)}
                        disabled={project?.isArchived}
                        className={cn(
                          "w-8 h-8 rounded-lg border-2 flex items-center justify-center text-lg transition-all bg-white",
                          icon === i ? "border-black scale-110 shadow-sm" : "border-slate-200",
                          !project?.isArchived ? "hover:border-slate-300" : "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-6">
              <Button 
                onClick={handleSave} 
                disabled={updateProjectMutation.isPending || project?.isArchived}
              >
                Save Changes
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>
                Save this project structure to reuse it for future projects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Plus className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="font-medium">Save as Template</p>
                    <p className="text-xs text-muted-foreground">
                      Creates a reusable copy of all tasks and subtasks.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => duplicateAsTemplateMutation.mutate()}
                  disabled={duplicateAsTemplateMutation.isPending}
                >
                  {duplicateAsTemplateMutation.isPending ? "Saving..." : "Save as Template"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Status</CardTitle>
              <CardDescription>
                Archiving a project hides it from the sidebar and active project lists.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  {project?.isArchived ? (
                    <RotateCcw className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Archive className="h-5 w-5 text-slate-500" />
                  )}
                  <div>
                    <p className="font-medium">
                      {project?.isArchived ? "Restore Project" : "Archive Project"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project?.isArchived 
                        ? "Bring this project back to the active sidebar." 
                        : "Hide this project from the active workspace."}
                    </p>
                  </div>
                </div>
                <Button 
                  variant={project?.isArchived ? "default" : "outline"} 
                  size="sm"
                  onClick={handleToggleArchive}
                  disabled={updateProjectMutation.isPending}
                >
                  {project?.isArchived ? "Unarchive" : "Archive"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Permanently delete this project and all of its data. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm text-red-600 mb-4">
                  Once you delete a project, there is no going back. Please be certain.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Project</DialogTitle>
                      <DialogDescription>
                        Are you absolutely sure you want to delete <span className="font-bold text-foreground">"{project?.name}"</span>? 
                        All tasks, comments, and attachments will be permanently removed.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button 
                        variant="destructive" 
                        onClick={() => deleteProjectMutation.mutate()}
                        disabled={deleteProjectMutation.isPending}
                      >
                        {deleteProjectMutation.isPending ? "Deleting..." : "Permanently Delete"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Project Members</CardTitle>
                <CardDescription>Manage who has access to this project and their roles.</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Member to Project</DialogTitle>
                    <DialogDescription>
                      Only members of the workspace can be added to this project.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Member</Label>
                      <Select id="targetUserId">
                        <SelectTrigger>
                          <SelectValue placeholder="Select a workspace member" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMembers.map((m: any) => (
                            <SelectItem key={m.user.id} value={m.user.id}>
                              {m.user.firstName} {m.user.lastName} ({m.user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select id="targetRole" defaultValue="MEMBER">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OWNER">Owner</SelectItem>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="VIEWER">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button 
                      onClick={() => {
                        const userId = (document.getElementById("targetUserId") as HTMLSelectElement)?.value;
                        const role = (document.getElementById("targetRole") as HTMLSelectElement)?.value || "MEMBER";
                        if (userId) {
                          addMemberMutation.mutate({ userId, role });
                        }
                      }}
                      disabled={addMemberMutation.isPending}
                    >
                      Add to Project
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isMembersLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground animate-pulse">
                        Loading members...
                      </TableCell>
                    </TableRow>
                  ) : projectMembers?.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.user.image} />
                            <AvatarFallback>{member.user.firstName?.[0]}{member.user.lastName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{member.user.firstName} {member.user.lastName}</span>
                            <span className="text-xs text-muted-foreground">{member.user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          defaultValue={member.role}
                          onValueChange={(newRole) => updateMemberRoleMutation.mutate({ memberId: member.id, role: newRole })}
                          disabled={updateMemberRoleMutation.isPending}
                        >
                          <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OWNER">Owner</SelectItem>
                            <SelectItem value="MEMBER">Member</SelectItem>
                            <SelectItem value="VIEWER">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeMemberMutation.mutate(member.id)}
                          disabled={removeMemberMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-500" />
                Understanding Project Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-white rounded-md border text-xs space-y-1">
                  <p className="font-bold">Project Owner</p>
                  <p className="text-muted-foreground">Full control. Can manage members, settings, and sections.</p>
                </div>
                <div className="p-3 bg-white rounded-md border text-xs space-y-1">
                  <p className="font-bold">Project Member</p>
                  <p className="text-muted-foreground">Collaboration. Can create, edit, and delete tasks.</p>
                </div>
                <div className="p-3 bg-white rounded-md border text-xs space-y-1">
                  <p className="font-bold">Project Viewer</p>
                  <p className="text-muted-foreground">Read-only. Can view everything but cannot make changes.</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                Note: Workspace Owners always have full administrative access to all projects.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
