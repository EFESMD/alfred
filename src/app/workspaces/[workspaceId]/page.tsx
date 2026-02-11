import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FolderOpen, CheckSquare, Users, Archive } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const [stats, projects] = await Promise.all([
    prisma.$transaction([
      prisma.project.count({ where: { workspaceId, isArchived: false, isTemplate: false } }),
      prisma.task.count({ where: { project: { workspaceId, isTemplate: false } } }),
      prisma.workspaceMember.count({ where: { workspaceId } }),
    ]),
    prisma.project.findMany({
      where: { workspaceId, isTemplate: false },
      orderBy: { updatedAt: "desc" },
    })
  ]);

  const activeProjects = projects.filter(p => !p.isArchived);
  const archivedProjects = projects.filter(p => p.isArchived);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Workspace Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[0]}</div>
          </CardContent>
        </Card>
        {/* ... (rest of stats cards) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[1]}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[2]}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeProjects.map((project) => (
            <Link key={project.id} href={`/workspaces/${workspaceId}/projects/${project.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer group h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div 
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm border",
                        project.color || "bg-blue-50 border-blue-100 text-blue-600"
                      )}
                      style={project.color && project.color.startsWith('#') ? { backgroundColor: project.color } : {}}
                    >
                      {project.icon || <FolderOpen className="h-5 w-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-1 text-xs">
                        {project.description || "No description"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
          {activeProjects.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No active projects found.</p>
          )}
        </div>
      </div>

      {archivedProjects.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-muted-foreground">
            <Archive className="h-5 w-5" />
            Archived Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
            {archivedProjects.map((project) => (
              <Link key={project.id} href={`/workspaces/${workspaceId}/projects/${project.id}`}>
                <Card className="hover:border-slate-400 transition-colors cursor-pointer bg-slate-50/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-200 text-slate-500 border border-slate-300">
                        <Archive className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-muted-foreground italic">{project.name}</CardTitle>
                        <CardDescription className="line-clamp-1 text-xs">Archived Project</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
