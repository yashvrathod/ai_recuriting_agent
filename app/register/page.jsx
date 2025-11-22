"use client";

import { RegisterForm } from "../../components/register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="space-y-6">
          {/* <h1 className="text-3xl font-bold tracking-tight text-center">
            Create an Account
          </h1>
          <p className="text-muted-foreground text-center">
            Enter your details to get started.
          </p> */}

          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
