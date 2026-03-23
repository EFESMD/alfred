"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Layout, 
  FolderKanban, 
  CheckSquare, 
  ShieldCheck, 
  UserCheck, 
  Clock,
  ArrowLeft,
  Mail,
  Trash2,
  AlertTriangle,
  FileTerminal,
  RefreshCw,
  Send
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
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
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null);
  const [testEmailTarget, setTestEmailTarget] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized access. Admin only.");
        throw new Error("Failed to fetch admin stats");
      }
      return res.json();
    },
  });

  const { data: emailLogs, refetch: refetchLogs, isFetching: isFetchingLogs } = useQuery({
    queryKey: ["email-logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/logs/email");
      if (!res.ok) return "Failed to fetch logs";
      return res.text();
    },
    enabled: !!data, // Only fetch if admin stats succeeded
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: async (targetEmail: string) => {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to send test email");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Test email sent! Check your inbox.");
      refetchLogs();
    },
    onError: (error: any) => {
      toast.error(`Email failed: ${error.message}`);
      refetchLogs();
    }
  });

  const verifyUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch("/api/admin/stats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to verify user");
      return res.json();
    },
    onSuccess: () => {
      toast.success("User verified manually");
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/stats?userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to delete user");
      }
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading secure admin panel...</div>;
  
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <h1 className="text-4xl font-bold text-slate-200">404</h1>
      <p className="text-muted-foreground">Page not found or access denied.</p>
      <Link href="/dashboard">
        <Button variant="outline" size="sm">Go back to dashboard</Button>
      </Link>
    </div>
  );

  const { stats, users } = data;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Admin</h1>
            <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mt-1">Master Control Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 px-3 py-1">
            <ShieldCheck className="h-3 w-3" />
            Master Admin Mode
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Workspaces</CardTitle>
            <Layout className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkspaces}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Email Diagnostics Card */}
      <Card className="shadow-sm border-indigo-100 bg-indigo-50/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-500" />
            Email System Diagnostics
          </CardTitle>
          <CardDescription>Test SMTP configuration and view transmission logs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Test Email Section */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label>Send Test Email To</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="name@example.com" 
                    value={testEmailTarget}
                    onChange={(e) => setTestEmailTarget(e.target.value)}
                    className="bg-white"
                  />
                  <Button 
                    onClick={() => sendTestEmailMutation.mutate(testEmailTarget)}
                    disabled={!testEmailTarget || sendTestEmailMutation.isPending}
                    className="gap-2"
                  >
                    {sendTestEmailMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Test
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Triggers an immediate email send attempt using current server configuration.
                </p>
              </div>
            </div>

            {/* Logs Section */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <FileTerminal className="h-4 w-4" />
                  Live System Logs
                </Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs gap-1" 
                  onClick={() => refetchLogs()}
                  disabled={isFetchingLogs}
                >
                  <RefreshCw className={`h-3 w-3 ${isFetchingLogs ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
              <div className="bg-slate-950 text-slate-50 p-3 rounded-md font-mono text-xs h-[150px] overflow-y-auto whitespace-pre-wrap shadow-inner">
                {emailLogs || "No logs available."}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle>User Directory</CardTitle>
          <CardDescription>A complete list of all registered members in the system.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Workspaces</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: any) => (
                <TableRow key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{user.firstName} {user.lastName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{user.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="h-3 w-3 opacity-50" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="h-3 w-3 opacity-50" />
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal text-xs px-2 py-0">
                      {user._count?.memberships || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.emailVerified ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1.5 font-medium py-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 gap-1.5 font-medium py-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!user.emailVerified && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5"
                          onClick={() => verifyUserMutation.mutate(user.id)}
                          disabled={verifyUserMutation.isPending}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Verify
                        </Button>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setUserToDelete({ id: user.id, name: `${user.firstName} ${user.lastName}` })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                              Delete User Account
                            </DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete <span className="font-bold text-foreground">{user.firstName} {user.lastName}</span>?
                              This will remove all their memberships and personal data. This action is permanent.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button 
                              variant="destructive" 
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              disabled={deleteUserMutation.isPending}
                            >
                              {deleteUserMutation.isPending ? "Deleting..." : "Permanently Delete User"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
