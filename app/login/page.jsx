"use client";

import { LoginForm } from "../../components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight text-center">
            Sign in
          </h1>
          <p className="text-muted-foreground text-center">
            Welcome back! Please enter your details.
          </p>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
