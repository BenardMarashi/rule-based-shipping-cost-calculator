import { json } from "@remix-run/node";

export async function action({ request }) {
  try {
    // Parse the rate request from Shopify
    const data = await request.json();
    console.log("Received shipping rate request:", JSON.stringify(data, null, 2));
    
    // Extract the items from the request
    const { rate } = data;
    const items = rate.items || [];
    
    // Calculate the total weight in grams
    const totalWeightGrams = items.reduce(
      (sum, item) => sum + (item.grams * item.quantity),
      0
    );
    
    // Convert to kg
    const totalWeightKg = totalWeightGrams / 1000;
    
    // For MVP, just provide a simple fixed rate
    // In a real app, you would calculate based on weight, destination, etc.
    const shippingRate = {
      service_name: "Standard Shipping",
      service_code: "standard",
      total_price: 1000, // $10.00
      description: "Standard shipping (MVP)",
      currency: "USD",
    };
    
    console.log("Returning shipping rate:", shippingRate);
    
    return json({ rates: [shippingRate] });
  } catch (error) {
    console.error("Error calculating shipping rates:", error);
    // Return an empty rates array to avoid breaking the checkout
    return json({ rates: [] });
  }
}