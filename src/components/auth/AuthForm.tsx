"use client";

import { useState, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { validatePassword, PASSWORD_REQUIREMENTS } from "@/lib/password-validator";
import { Check, X, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const passwordValidation = useMemo(() => {
    if (mode === "login") return null;
    return validatePassword(formData.password);
  }, [formData.password, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "register") {
        // Client-side complexity check
        if (!passwordValidation?.isValid) {
          throw new Error("Please fulfill all password requirements.");
        }

        // Client-side domain check
        const allowedDomain = "md.anadoluefes.com";
        if (!formData.email.toLowerCase().endsWith(`@${allowedDomain}`)) {
          throw new Error(`Registration is restricted to @${allowedDomain} email addresses.`);
        }

        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(error);
        }

        toast.success("Account created! Logging in...");
      }

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        const errorMessage = result.error === "CredentialsSignin" 
          ? "Invalid email or password. Make sure you have an account."
          : result.error;
        throw new Error(errorMessage);
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please check your details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Login" : "Create an account"}</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Enter your email below to login to your account"
            : "Only @md.anadoluefes.com emails are accepted for registration."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {mode === "register" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name.surname@md.anadoluefes.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-xs text-muted-foreground hover:text-primary underline underline-offset-4"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            
            {mode === "register" && formData.password.length > 0 && passwordValidation && (
              <div className="space-y-3 pt-2">
                {/* Strength Meter */}
                <div className="space-y-1.5">
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
                </div>

                {/* Requirements List */}
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
                          "text-[11px] transition-colors",
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
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-6">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || (mode === "register" && !passwordValidation?.isValid)}
          >
            {isLoading ? "Processing..." : mode === "login" ? "Login" : "Create Account"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="underline underline-offset-4 hover:text-primary font-medium"
                  onClick={() => router.push(`/register${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`)}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="underline underline-offset-4 hover:text-primary font-medium"
                  onClick={() => router.push(`/login${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`)}
                >
                  Login
                </button>
              </>
            )}
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
