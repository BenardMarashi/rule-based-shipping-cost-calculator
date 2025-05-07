// app/routes/api.health.jsx
import { json } from "@remix-run/node";

export async function loader() {
  return json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "shipping-cost-calculator" 
  });
}

export async function action() {
  return json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "shipping-cost-calculator" 
  });
}