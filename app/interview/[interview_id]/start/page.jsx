"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getVapiClient } from "@/lib/vapiconfig";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";
import TimmerComponent from "./_components/TimmerComponent";

export default function StartInterview() {
  const params = useParams();
  const interviewId = params?.interview_id;

  const [interviewInfo, setInterviewInfo] = useState(null);
  const [vapi, setVapi] = useState(null);
  const [subtitles, setSubtitles] = useState("");
  const [start, setStart] = useState(false);
  const [isVapiReady, setIsVapiReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // ================================
  // Fetch interview data from Supabase
  // ================================
  useEffect(() => {
    const fetchInterviewData = async () => {
      if (!interviewId) {
        toast.error("Interview ID is missing from URL.");
        return;
      }

      const { data, error } = await supabase
        .from("interviews")
        .select("interview_id, jobposition, questionlist, type, useremail")
        .eq("interview_id", interviewId)
        .single();

      if (error || !data) {
        console.error("❌ Error fetching interview:", error);
        toast.error("Failed to load interview details.");
        return;
      }

      // Normalize questionlist
      let parsedQuestions = [];
      try {
        if (Array.isArray(data.questionlist)) {
          parsedQuestions = data.questionlist;
        } else if (
          data.questionlist &&
          typeof data.questionlist === "object" &&
          data.questionlist.interviewQuestions
        ) {
          parsedQuestions = Array.isArray(data.questionlist.interviewQuestions)
            ? data.questionlist.interviewQuestions
            : Object.values(data.questionlist.interviewQuestions);
        } else if (typeof data.questionlist === "string") {
          parsedQuestions =
            JSON.parse(data.questionlist)?.interviewQuestions || [];
        }
      } catch (err) {
        console.error("❌ Failed to parse questionlist:", err);
        toast.error("Error reading interview questions.");
      }

      const normalizedData = {
        ...data,
        questionlist: parsedQuestions,
      };

      console.log("✅ Interview fetched and normalized:", normalizedData);
      setInterviewInfo(normalizedData);
    };

    fetchInterviewData();
  }, [interviewId]);

  // ================================
  // Initialize VAPI client in browser
  // ================================
  useEffect(() => {
    // Diagnostic function to help debug VAPI issues
    const runDiagnostics = () => {
      console.log("🔍 Running VAPI diagnostics...");
      console.log("✅ Browser:", navigator.userAgent);
      console.log("✅ HTTPS:", window.location.protocol === "https:");
      console.log("✅ MediaDevices support:", !!navigator.mediaDevices);
      console.log(
        "✅ getUserMedia support:",
        !!navigator.mediaDevices?.getUserMedia
      );
      console.log(
        "✅ VAPI API Key configured:",
        !!process.env.NEXT_PUBLIC_VAPI_API_KEY
      );
      console.log("✅ Environment:", process.env.NODE_ENV);
    };

    const initializeVapi = async () => {
      try {
        // Run diagnostics first
        runDiagnostics();

        // Check browser support for required APIs
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast.error("Your browser doesn't support audio recording.");
          return;
        }

        // Check for API key before initialization
        const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
        if (!apiKey) {
          console.error("❌ VAPI API key is missing");
          toast.error("VAPI configuration error: Missing API key");
          return;
        }

        // Validate API key format
        if (!apiKey.includes("-")) {
          console.error("❌ VAPI API key format appears invalid");
          toast.error("VAPI configuration error: Invalid API key format");
          return;
        }

        // Check network connectivity with a simple test
        try {
          console.log("🌐 Testing network connectivity...");
          const response = await fetch("https://api.vapi.ai/health", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });
          console.log("🌐 VAPI health check response:", response.status);
        } catch (netError) {
          console.error("🌐 Network/VAPI connectivity issue:", netError);
          toast.warning(
            "Network connectivity issue detected - this may affect the interview"
          );
        }

        // Request microphone permission early
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log("✅ Microphone permission granted");
        } catch (permError) {
          console.error("❌ Microphone permission denied:", permError);
          toast.error(
            "Microphone access is required for the interview. Please allow microphone access and refresh the page."
          );
          return;
        }

        const client = getVapiClient();
        if (!client) {
          toast.error("VAPI initialization failed. Check your API key.");
          return;
        }

        setVapi(client);
        setIsVapiReady(true);
        console.log("✅ VAPI client initialized successfully.");

        // Set up event listeners
        client.on("message", (msg) => {
          console.log("VAPI message:", msg);
          if (msg?.type === "transcript" && msg?.transcriptType === "final") {
            setSubtitles(msg.transcript);
          } else if (msg?.type === "function-call") {
            console.log("Function call received:", msg);
          }
        });

        client.on("call-start", () => {
          console.log("Call started");
          toast.success("🎤 AI Interview started!");
          setStart(true);
          setIsStarting(false);
        });

        client.on("call-end", () => {
          console.log("Call ended");
          toast.info("Interview ended. Saving results...");
          setStart(false);
          setIsStarting(false);
        });

        client.on("error", (error, ...additionalArgs) => {
          console.error("VAPI error:", error);
          console.error("VAPI error type:", typeof error);
          console.error("VAPI error keys:", Object.keys(error || {}));
          console.error("VAPI additional args:", additionalArgs);
          console.error("VAPI client state:", {
            isConnected: client?.isConnected,
            isMuted: client?.isMuted,
            isActive: client?.isActive,
          });

          // Try to get more error context
          try {
            console.error("VAPI error JSON:", JSON.stringify(error, null, 2));
          } catch (e) {
            console.error("Could not stringify error:", e);
          }

          // Check if this is a normal meeting termination (not an actual error)
          const isNormalTermination = 
            error?.error?.type === "ejected" && 
            error?.error?.msg === "Meeting has ended";

          if (isNormalTermination) {
            console.log("Meeting ended normally (ejected)");
            toast.info("Interview session ended.");
            setStart(false);
            setIsStarting(false);
            return;
          }

          // Enhanced error message handling for actual errors
          let errorMessage = "Voice interface error occurred";
          if (error) {
            if (error.message) {
              errorMessage = error.message;
            } else if (error.error && typeof error.error === "string") {
              errorMessage = error.error;
            } else if (error.error && error.error.msg) {
              errorMessage = error.error.msg;
            } else if (error.description) {
              errorMessage = error.description;
            } else if (error.code) {
              errorMessage = `Error code: ${error.code}`;
            } else if (typeof error === "string") {
              errorMessage = error;
            } else if (Object.keys(error).length === 0) {
              errorMessage =
                "Unknown VAPI error - possible network or microphone issue";
            }
          }

          toast.error(`Interview error: ${errorMessage}`);
          setStart(false);
          setIsStarting(false);
        });

        client.on("volume-level", (volume) => {
          // Optional: Handle volume levels for visual feedback
          console.log("Volume level:", volume);
        });

        // Additional event listeners for debugging
        client.on("speech-start", () => {
          console.log("🎤 Speech started");
        });

        client.on("speech-end", () => {
          console.log("🎤 Speech ended");
        });

        client.on("connection-error", (error) => {
          console.error("🔌 Connection error:", error);
          toast.error(
            "Connection error - please check your internet connection"
          );
        });

        client.on("warning", (warning) => {
          console.warn("⚠️ VAPI warning:", warning);
        });

        client.on("timeout", () => {
          console.error("⏰ VAPI timeout");
          toast.error("Interview timed out - please try again");
        });
      } catch (error) {
        console.error("Failed to initialize VAPI:", error);
        toast.error("Failed to initialize voice interface.");
      }
    };

    initializeVapi();

    // Cleanup function
    return () => {
      if (vapi) {
        try {
          vapi.stop();
        } catch (e) {
          console.log("VAPI cleanup: instance was not active");
        }
      }
    };
  }, []);

  // ================================
  // Manual start interview function
  // ================================
  const startInterview = async () => {
    if (!vapi || !interviewInfo || start || isStarting) return;

    setIsStarting(true);
    const jobPosition = interviewInfo.jobposition;
    const questionList = interviewInfo.questionlist || [];
    const candidate_name =
      interviewInfo.useremail?.split("@")[0] || "Candidate";

    if (!jobPosition || !questionList.length) {
      toast.error("Interview data incomplete.");
      setIsStarting(false);
      return;
    }

    // ✅ Request microphone access early
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach((track) => track.stop());
      console.log("✅ Microphone access granted");
    } catch (err) {
      console.error("❌ Mic access denied:", err);
      toast.error("Microphone access is required to start the interview.");
      setIsStarting(false);
      return;
    }

    // Format questions properly
    const formattedQuestions = questionList
      .map((q, index) => `${index + 1}. ${q?.question || q}`)
      .join("\n");

    const assistant = {
      name: "AI Recruiter",
      firstMessage: `Hi ${candidate_name}! Welcome to your ${jobPosition} interview. I'm excited to learn more about you. Are you ready to begin?`,
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional AI interviewer conducting an interview for the ${jobPosition} position.

INTERVIEW QUESTIONS:
${formattedQuestions}

INSTRUCTIONS:
- Ask questions one at a time from the list above
- Wait for the candidate's complete response before moving to the next question
- Be encouraging, professional, and friendly
- Take notes mentally of their responses
- After all questions, provide a brief, constructive feedback summary
- Keep responses concise and natural
- If a candidate's answer is too brief, ask follow-up questions to get more detail

Remember: This is a supportive interview environment. Help the candidate succeed while gathering meaningful information.`,
          },
        ],
      },
      voice: {
        provider: "playht",
        voiceId: "jennifer",
        speed: 1.0,
      },
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en",
      },
      endCallMessage:
        "Thank you for your time today. The interview has been completed. Good luck!",
      endCallPhrases: ["goodbye", "thank you", "end interview", "that's all"],
      backgroundSound: "off",
    };

    try {
      console.log("Starting VAPI with assistant config:", assistant);
      await vapi.start(assistant);
      console.log("✅ VAPI started successfully");
    } catch (err) {
      console.error("❌ VAPI start error:", err);
      console.error("❌ Error type:", typeof err);
      console.error("❌ Error keys:", Object.keys(err || {}));

      let errorMsg = "Please check your microphone and try again.";
      if (err) {
        if (err.message) {
          errorMsg = err.message;
        } else if (err.error) {
          errorMsg = err.error;
        } else if (typeof err === "string") {
          errorMsg = err;
        } else if (err.status) {
          errorMsg = `API Error (${err.status}): Check your VAPI configuration`;
        }
      }

      toast.error(`Failed to start interview: ${errorMsg}`);
      setIsStarting(false);
    }
  };

  // ================================
  // Render Component
  // ================================
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center">
      <h1 className="text-3xl font-bold text-indigo-700 mb-4">
        AI Interview Session
      </h1>

      {interviewInfo ? (
        <p className="text-gray-600 mb-6">
          Interview for <strong>{interviewInfo.jobposition}</strong> | Type:{" "}
          {interviewInfo.type}
        </p>
      ) : (
        <p>Loading interview details...</p>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 w-[90%] max-w-xl">
        {/* Status Display */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">
            Status:{" "}
            {!isVapiReady
              ? "🔄 Initializing voice interface..."
              : !interviewInfo
                ? "📋 Loading interview data..."
                : isStarting
                  ? "🎙️ Starting interview..."
                  : start
                    ? "🎤 Interview in progress"
                    : "✅ Ready to start"}
          </p>
        </div>

        {/* Conversation Display */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg min-h-[100px] flex items-center justify-center">
          <p className="text-gray-700 text-center">
            {start && subtitles ? (
              <>
                <span className="block text-sm text-gray-500 mb-2">
                  AI Response:
                </span>
                "{subtitles}"
              </>
            ) : start ? (
              "🎧 Listening for your response..."
            ) : (
              "Voice interview will appear here once started."
            )}
          </p>
        </div>

        {/* Control Buttons */}
        <div className="mt-4 flex flex-col items-center gap-3">
          {!start ? (
            <button
              onClick={startInterview}
              disabled={!isVapiReady || !interviewInfo || isStarting}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isVapiReady && interviewInfo && !isStarting
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isStarting ? "🎙️ Starting..." : "🎤 Start Interview"}
            </button>
          ) : (
            <button
              onClick={() => {
                vapi?.stop();
                toast.info("Interview stopped manually.");
                setStart(false);
                setIsStarting(false);
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              🛑 Stop Interview
            </button>
          )}

          {/* Instructions */}
          {!start && isVapiReady && interviewInfo && (
            <p className="text-sm text-gray-600 text-center max-w-md">
              📝 Make sure you're in a quiet environment with a good microphone.
              Click "Start Interview" when you're ready to begin.
            </p>
          )}

          {/* Timer */}
          <div className="text-sm text-gray-500 flex gap-2 items-center">
            <span>⏱ Timer:</span> <TimmerComponent start={start} />
          </div>
        </div>
      </div>
    </div>
  );
}
