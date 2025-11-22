import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    if (!body.type || !body.interviewId) {
      return NextResponse.json(
        { error: "Missing required fields: type or interviewId" },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.vapi.ai/call/web", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    console.log("VAPI response:", text);

    if (!res.ok) {
      return NextResponse.json(
        { error: `VAPI error: ${text}` },
        { status: res.status }
      );
    }

    return NextResponse.json(JSON.parse(text));
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
