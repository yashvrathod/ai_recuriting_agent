import Vapi from "@vapi-ai/web";

let vapiInstance = null;

export const getVapiClient = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.error("❌ VAPI can only be initialized in browser environment");
    return null;
  }

  const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
  if (!apiKey) {
    console.error("❌ Missing NEXT_PUBLIC_VAPI_API_KEY");
    return null;
  }

  if (!vapiInstance) {
    try {
      console.log("🔧 Initializing VAPI client...");
      vapiInstance = new Vapi(apiKey); // Updated to match v2.x API
      
      // Add global error handler
      vapiInstance.on("error", (error) => {
        console.error("🚨 Global VAPI error handler:", error);
      });
      
      console.log("✅ VAPI client initialized with key:", apiKey.substring(0, 8) + "...");
    } catch (error) {
      console.error("❌ Failed to initialize VAPI:", error);
      console.error("❌ Error type:", typeof error);
      console.error("❌ Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      return null;
    }
  }

  return vapiInstance;
};

// Function to reset VAPI instance (useful for debugging)
export const resetVapiClient = () => {
  if (vapiInstance) {
    try {
      vapiInstance.stop();
    } catch (e) {
      console.log("VAPI instance was not active");
    }
  }
  vapiInstance = null;
};
