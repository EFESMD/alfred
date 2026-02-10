import { AuthForm } from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <AuthForm mode="register" />
    </div>
  );
}
