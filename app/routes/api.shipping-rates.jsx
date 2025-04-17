// app/routes/api.shipping-rates.jsx
import { json } from "@remix-run/node";
import { splitParcels, selectBestCarrier } from "../services/shipping-calculator.server";

export async function action({ request }) {
  try {
    // Parse the rate request from Shopify
    const data = await request.json();
    console.log("Received shipping rate request:", JSON.stringify(data, null, 2));
    
    // Extract the items from the request
    const { rate } = data;
    const items = rate.items || [];
    
    // Configure DPD's max weight (31.5kg = 31500g)
    const maxWeight = 31500;
    
    // Split items into parcels
    const parcels = splitParcels(items, maxWeight);
    
    // Select the best carrier
    const bestCarrier = await selectBestCarrier(parcels);
    
    // Format the response as expected by Shopify
    const shippingRate = {
      service_name: `${bestCarrier.name} (${parcels.length} ${parcels.length === 1 ? 'parcel' : 'parcels'})`,
      service_code: bestCarrier.name.toLowerCase().replace(/\s+/g, '_'),
      total_price: Math.round(bestCarrier.totalCost),
      description: `Optimized shipping with ${parcels.length} ${parcels.length === 1 ? 'parcel' : 'parcels'}`,
      currency: bestCarrier.currency,
    };
    
    console.log("Returning shipping rate:", shippingRate);
    
    return json({ rates: [shippingRate] });
  } catch (error) {
    console.error("Error calculating shipping rates:", error);
    // Return a fallback rate to avoid breaking the checkout
    return json({ 
      rates: [{
        service_name: "Standard Shipping",
        service_code: "standard",
        total_price: 1000, // $10.00
        description: "Standard shipping (fallback)",
        currency: "USD",
      }] 
    });
  }
}