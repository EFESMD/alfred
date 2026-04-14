"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { validatePassword, PASSWORD_REQUIREMENTS } from "@/lib/password-validator";
import { Check, X, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordValidation = useMemo(() => validatePassword(password), [password]);

  useEffect(() => {
    if (!token || !email) {
      toast.error("Invalid reset link. Missing parameters.");
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!passwordValidation.isValid) {
      toast.error("Password does not meet requirements");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to reset password");
      }

      setIsSuccess(true);
      toast.success("Password reset successful!");
      setTimeout(() => router.push("/login"), 3000);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md border-emerald-100 bg-emerald-50/10">
        <CardContent className="pt-8 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold">Password Reset!</h2>
          <p className="text-sm text-muted-foreground text-pretty">
            Your password has been updated successfully. You will be redirected to the login page shortly.
          </p>
          <Button className="w-full mt-4" onClick={() => router.push("/login")}>
            Login Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Set New Password
        </CardTitle>
        <CardDescription>
          For security, your new password must be strong.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!token || !email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••••••"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={!token || !email}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight">Passwords do not match</p>
            )}
          </div>

          {password.length > 0 && (
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

              <div className="grid grid-cols-1 gap-1.5 p-3 rounded-lg border bg-slate-50/50">
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
                        "text-[11px]",
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
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !passwordValidation.isValid || password !== confirmPassword || !token}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
