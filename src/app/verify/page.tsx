"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your account...");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const res = await fetch(`/api/verify?token=${token}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to verify email");
        }

        setStatus("success");
        setMessage("Account verified successfully!");
        toast.success("Account activated!");
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message);
        toast.error("Verification failed");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <Card className="w-[450px] text-center shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">
          {status === "loading" && "Activare Cont"}
          {status === "success" && "Cont Activat!"}
          {status === "error" && "Eroare Activare"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <CheckCircle2 className="h-16 w-12 text-green-500" />
            <p className="text-slate-600 font-medium">{message}</p>
            <p className="text-sm text-muted-foreground px-6">
              Adresa ta de email a fost confirmată. Acum te poți autentifica în platforma Oxana.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-destructive font-medium">{message}</p>
            <p className="text-sm text-muted-foreground px-6">
              Link-ul ar putea fi invalid sau expirat. Te rugăm să încerci să te înregistrezi din nou sau să contactezi echipa de suport.
            </p>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-6 bg-slate-50/50">
        <Button asChild className="w-full">
          <Link href="/login">Mergi la Autentificare</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
