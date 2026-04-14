"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  LogOut, 
  User, 
  Mail, 
  Building2, 
  Save,
  Loader2,
  ArrowLeft,
  Upload,
  Lock,
  KeyRound,
  ShieldCheck,
  Check,
  X,
  History
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { validatePassword, PASSWORD_REQUIREMENTS } from "@/lib/password-validator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function PasswordSection({ user }: { user: any }) {
  const [step, setStep] = useState<"input" | "otp">("input");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isPending, setIsPending] = useState(false);

  const passwordValidation = useMemo(() => validatePassword(newPassword), [newPassword]);

  const handleRequestChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!passwordValidation.isValid) {
      toast.error("New password does not meet requirements");
      return;
    }

    setIsPending(true);
    try {
      const res = await fetch("/api/profile/password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to initiate change");
      }

      toast.success("Verification code sent to your email!");
      setStep("otp");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsPending(false);
    }
  };

  const handleConfirmChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const res = await fetch("/api/profile/password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, newPassword }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Invalid verification code");
      }

      toast.success("Password changed successfully!");
      setStep("input");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          Security
        </CardTitle>
        <CardDescription>
          Update your password and manage account security.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.lastPasswordChange && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-slate-50 p-2 rounded border border-dashed mb-2">
            <History className="h-3 w-3" />
            Last changed: {format(new Date(user.lastPasswordChange), "PPP 'at' p")}
          </div>
        )}

        {step === "input" ? (
          <form onSubmit={handleRequestChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Required to make changes"
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 10 chars"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Match new password"
                />
              </div>
            </div>

            {newPassword.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold">
                  <span className={cn(
                    passwordValidation.score <= 1 ? "text-red-500" :
                    passwordValidation.score <= 3 ? "text-amber-500" :
                    "text-emerald-500"
                  )}>
                    Strength: {
                      passwordValidation.score <= 1 ? "Weak" :
                      passwordValidation.score <= 3 ? "Medium" :
                      "Strong"
                    }
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div 
                        key={step} 
                        className={cn(
                          "h-1 w-6 rounded-full transition-colors",
                          step <= passwordValidation.score 
                            ? (passwordValidation.score <= 1 ? "bg-red-500" : passwordValidation.score <= 3 ? "bg-amber-500" : "bg-emerald-500")
                            : "bg-slate-200"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 p-3 rounded-lg border bg-slate-50/50">
                  {PASSWORD_REQUIREMENTS.map((req) => {
                    const isMet = !passwordValidation.errors[req.key];
                    return (
                      <div key={req.key} className="flex items-center gap-2">
                        {isMet ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <X className="h-3 w-3 text-slate-300" />
                        )}
                        <span className={cn(
                          "text-[10px]",
                          isMet ? "text-emerald-700 font-medium" : "text-slate-500"
                        )}>
                          {req.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button 
                type="submit" 
                className="gap-2"
                disabled={isPending || !passwordValidation.isValid || newPassword !== confirmPassword || !currentPassword}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Change Password
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleConfirmChange} className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                <ShieldCheck className="h-4 w-4" />
                Two-Step Verification
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                We've sent a 6-digit verification code to your email. Please enter it below to confirm your new password.
              </p>
            </div>

            <div className="space-y-2 text-center py-4">
              <Label htmlFor="otp" className="text-center block text-xs uppercase tracking-widest text-muted-foreground">Verification Code</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-3xl h-14 font-bold tracking-[10px] bg-slate-50"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={() => setStep("input")}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isPending || otp.length < 6}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Change
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName?: string; lastName?: string; image?: string }) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large (max 2MB)");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }

      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Avatar updated!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isChanged = firstName !== (user?.firstName || "") || lastName !== (user?.lastName || "");

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        </div>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Manage your public profile information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-slate-100">
                  <AvatarImage src={user?.image || ""} />
                  <AvatarFallback className="text-2xl font-semibold">
                    {user?.firstName?.[0] || user?.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>

                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />

                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-4 w-full gap-2 h-8 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3" />
                  )}
                  Change Photo
                </Button>
              </div>
              <div className="space-y-1 text-center sm:text-left pt-2 flex-1">
                <h3 className="font-medium text-lg">{user?.name}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="pt-2 text-[11px] text-muted-foreground bg-slate-50 p-2 rounded border border-dashed">
                  <p className="font-semibold uppercase text-[10px] mb-1">Requirements:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Max file size: 2MB</li>
                    <li>Formats: JPG, PNG, GIF, WEBP</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  disabled={updateProfileMutation.isPending || !isChanged}
                  onClick={() => updateProfileMutation.mutate({ firstName, lastName })}
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>

              <div className="space-y-2 pt-4">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  value={user?.email || ""} 
                  disabled 
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed directly. Contact support if needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Security Section */}
        <PasswordSection user={user} />

        <Card>
          <CardHeader>
            <CardTitle>My Workspaces</CardTitle>
            <CardDescription>
              Workspaces you are currently a member of.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user?.memberships?.map((membership: any) => (
                <div 
                  key={membership.workspace.id} 
                  className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded border shadow-sm">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{membership.workspace.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {membership.role.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <Link href={`/workspaces/${membership.workspace.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </div>
              ))}
              {(!user?.memberships || user.memberships.length === 0) && (
                <p className="text-sm text-center py-4 text-muted-foreground italic">
                  You are not a member of any workspaces yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}