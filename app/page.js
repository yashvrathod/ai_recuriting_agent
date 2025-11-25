"use client";
import Image from "next/image";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Brain,
  Users,
  Sparkles,
  Target,
  BarChart2,
  Clock,
  Zap,
  Check,
  Search,
  FileText,
  ShieldCheck,
  Award,
  Briefcase,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/services/supabaseClient";
import { useUser } from "@/app/client-providers";

export default function Home() {
  const router = useRouter();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { user } = useUser();

  /// lgoin wit hgoogle
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error(error.message);
  };

  const handleStartRecruiting = () => {
    router.push("/login"); //
  };

  useEffect(() => {
    // If user is loaded and logged in, redirect based on role
    if (user) {
      if (user.role === "recruiter") {
        router.push("/recruiter/dashboard");
      } else if (user.role === "candidate") {
        router.push("/candidate/dashboard");
      }
    }
  }, [user, router]);

  const clientLogos = [
    { logo: "/clientLogos/tata.png" },
    { logo: "/clientLogos/techmahindra.png" },
    { logo: "/clientLogos/eeshanya.png" },
    { logo: "/clientLogos/hrh.jpeg" },
    { logo: "/clientLogos/google.png" },
  ];

  const testimonials = [
    {
      quote:
        "From intuitive front-end design to seamless backend integration, the site is a true showcase of full-stack excellence.",
      author: "Dhanshree",
      image: "/user Photos/Dhanshree.jpeg",
      role: "Full Stack Developer, GreatHire",
      avatar: "/avatar2.jpg",
    },
    {
      quote:
        "Built with security at its core, the site ensures robust protection against vulnerabilities while maintaining smooth performance.",
      author: "Sujeeth",
      image: "/user Photos/Sujeeth.jpeg",
      role: "Information Security Analyst, GlobalSoft",
      avatar: "/avatar3.jpg",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/20 via-white to-indigo-50/20">
      {/* Floating Background Elements - More Dynamic */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-200/20 blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-indigo-200/20 blur-3xl animate-float-medium"></div>
        <div className="absolute top-1/3 right-1/3 w-48 h-48 rounded-full bg-blue-300/10 blur-3xl animate-float-fast"></div>
        <div className="absolute bottom-1/4 left-1/3 w-56 h-56 rounded-full bg-purple-200/15 blur-3xl animate-float-slow"></div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center min-h-screen relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-8 max-w-6xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative inline-block mb-12"
          >
            <div className="absolute -inset-4 bg-blue-100/50 rounded-full blur-lg"></div>
            <div className="relative bg-white p-6 rounded-full shadow-lg border border-blue-100 flex items-center justify-center">
              <Brain className="w-16 h-16 text-blue-600" />
              <Sparkles className="w-8 h-8 text-blue-400 absolute -top-2 -right-2 animate-pulse" />
              <div className="absolute -bottom-2 -left-2 bg-white px-3 py-1 rounded-full shadow-sm text-xs font-medium text-blue-600 border border-blue-100">
                AI-Powered
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 leading-tight tracking-tight"
          >
            Smarter Hiring, <br className="hidden sm:block" />
            Powered by AI
          </motion.h1>

          <div className="mt-12">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white group px-8 py-6 text-lg cursor-pointer"
              onClick={handleStartRecruiting} // Example navigation
            >
              Start Recruiting
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Transform your recruitment with intelligent matching, automated
            screening, and data-driven insights that deliver{" "}
            <span className="font-semibold text-blue-600">
              better candidates faster
            </span>
            .
          </motion.p>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        @keyframes float-medium {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-15px) translateX(-15px);
          }
        }
        @keyframes float-fast {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-10px) translateX(5px);
          }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 6s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: float-fast 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
