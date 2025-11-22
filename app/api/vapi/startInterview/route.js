import { getVapiClient } from "@/lib/vapiconfig";

export async function POST(req) {
  const body = await req.json();

  try {
    const vapi = getVapiClient();
    const result = await vapi.start(body.assistant);
    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
    });
  } catch (err) {
    console.error("Server-side VAPI error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
