// app/routes/api.health.jsx
import { json } from "@remix-run/node";

// Add CORS headers to allow health checks from anywhere
export const headers = ({ loaderHeaders, parentHeaders }) => {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  };
};

export async function loader({ request }) {
  // Check for OPTIONS request and handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    // Basic health check that also verifies database connectivity
    // We could add more checks here as needed
    return json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "shipping-cost-calculator",
      environment: process.env.NODE_ENV || "development",
      version: process.env.APP_VERSION || "1.0.0"
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return json({ 
      status: "error", 
      message: error.message,
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
}

// Add action to support POST requests to the health endpoint
export async function action({ request }) {
  return json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "shipping-cost-calculator",
    method: request.method
  });
}