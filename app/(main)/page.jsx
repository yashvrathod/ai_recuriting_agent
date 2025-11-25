"use client";

import { UserAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { userProfile } = UserAuth();
  const router = useRouter();

  useEffect(() => {
    if (!userProfile) return;

    if (userProfile.role === "recruiter") {
      router.push("/recruiter/dashboard");
    } else if (userProfile.role === "candidate") {
      router.push("/candidate/dashboard");
    }
  }, [userProfile, router]);

  return null;
}
