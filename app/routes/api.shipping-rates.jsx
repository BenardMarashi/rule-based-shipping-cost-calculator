// app/routes/api.shipping-rates.jsx
import { json } from "@remix-run/node";
import { splitParcels, selectBestCarrier } from "../services/shipping-calculator.server";
import { getCarriers } from "../models/carrier.server";

export async function action({ request }) {
  try {
    // Parse the rate request from Shopify
    const data = await request.json();
    console.log("Received shipping rate request:", JSON.stringify(data, null, 2));
    
    // Extract the items from the request
    const { rate } = data;
    const items = rate.items || [];
    const destination = rate.destination || {};
    
    // Log request details for debugging
    console.log(`Processing shipping request with ${items.length} items`);
    console.log(`Destination: ${JSON.stringify(destination)}`);
    
    // Get carriers from database
    const carriers = await getCarriers();
    
    if (!carriers || carriers.length === 0) {
      console.log("No carriers configured, returning default rate");
      return json({
        rates: [{
          service_name: "Standard Shipping",
          service_code: "standard",
          total_price: 1000, // $10.00
          description: "Standard shipping (no carriers configured)",
          currency: "USD",
        }]
      });
    }
    
    // Use the highest max weight as our constraint
    const maxWeight = Math.max(...carriers.map(carrier => carrier.maxWeight * 1000)); // Convert kg to g
    console.log(`Using max weight constraint: ${maxWeight}g`);
    
    // Split items into parcels
    const parcels = splitParcels(items, maxWeight);
    console.log(`Split order into ${parcels.length} parcels`);
    
    // Find the best carrier
    const bestCarrier = await selectBestCarrier(parcels);
    console.log(`Selected carrier: ${bestCarrier.name}`);
    
    // Calculate the total weight for display
    const totalWeight = items.reduce((sum, item) => sum + (item.grams * item.quantity), 0) / 1000; // in kg
    
    // Format the response as expected by Shopify
    const shippingRate = {
      service_name: `${bestCarrier.name} (${parcels.length} ${parcels.length === 1 ? 'parcel' : 'parcels'})`,
      service_code: bestCarrier.name.toLowerCase().replace(/\s+/g, '_'),
      total_price: Math.round(bestCarrier.totalCost),
      description: `Optimized shipping for ${totalWeight.toFixed(2)}kg in ${parcels.length} ${parcels.length === 1 ? 'parcel' : 'parcels'}`,
      currency: bestCarrier.currency || "USD",
    };
    
    console.log("Returning shipping rate:", shippingRate);
    
    // If there are multiple carriers, offer them as options as well
    const rates = [shippingRate];
    
    // Return the rates to Shopify
    return json({ rates });
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