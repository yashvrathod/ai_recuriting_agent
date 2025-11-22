import { QUESTIONS_PROMPT } from "@/services/Constants";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req) {
  try {
    const { jobPosition, jobDescription, duration, type } = await req.json();

    const FINAL_PROMPT = QUESTIONS_PROMPT.replace("{{jobTitle}}", jobPosition)
      .replace("{{jobDescription}}", jobDescription)
      .replace("{{duration}}", duration)
      .replace("{{type}}", type);

    console.log("🧠 Prompt Sent to GROQ:", FINAL_PROMPT);

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `
      You are an expert technical interviewer.
      Generate 8–12 structured interview questions for the given role.
      Respond in valid JSON only (no markdown).
      Format:
      {
        "interviewQuestions": [
          {"question": "string", "type": "technical | behavioral | situational | leadership"}
        ]
      }
    `,
        },
      ],
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
    });

    const message = completion.choices[0]?.message?.content || "";
    console.log("🧾 GROQ Raw Response:", message);

    // Return as-is (frontend will parse JSON)
    return NextResponse.json({ content: message });
  } catch (e) {
    console.error("❌ GROQ API Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
