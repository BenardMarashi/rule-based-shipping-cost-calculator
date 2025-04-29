// app/routes/api.shipping-rates.jsx
import { json } from "@remix-run/node";
import { splitParcels, selectBestCarrier } from "../services/shipping-calculator.server";
import { getCarriers } from "../models/carrier.server";

// Map from Shopify country codes to our country codes
const COUNTRY_CODE_MAP = {
  "AT": "AT",
  "DE": "DE",
  "BE": "BE",
  "BG": "BG",
  "CZ": "CZ",
  "DK": "DK",
  "EE": "EE",
  "ES": "ES",
  "FI": "FI",
  "FR": "FR",
  "GB": "GB",
  "GR": "GR",
  "HR": "HR",
  "HU": "HU",
  "IE": "IE",
  "IT": "IT",
  "LT": "LT",
  "LU": "LU",
  "LV": "LV",
  "NL": "NL",
  "PL": "PL",
  "PT": "PT",
  "RO": "RO",
  "SE": "SE",
  "SI": "SI",
  "SK": "SK",
  // Add more mappings as needed
};

export async function action({ request }) {
  try {
    // Parse the rate request from Shopify
    const data = await request.json();
    console.log("Received shipping rate request:", JSON.stringify(data, null, 2));
    
    // Extract the items and destination from the request
    const { rate } = data;
    const items = rate.items || [];
    const destination = rate.destination || {};
    
    // Get the destination country
    const destinationCountry = destination.country_code;
    const mappedCountryCode = COUNTRY_CODE_MAP[destinationCountry] || "AT"; // Default to Austria if not found
    
    // Log request details for debugging
    console.log(`Processing shipping request with ${items.length} items`);
    console.log(`Destination country: ${destinationCountry} (mapped to ${mappedCountryCode})`);
    
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
    
    // Find the best carrier for this destination
    const bestCarrier = await selectBestCarrier(parcels, mappedCountryCode);
    console.log(`Selected carrier: ${bestCarrier.name}`);
    
    // Calculate the total weight for display
    const totalWeight = items.reduce((sum, item) => sum + (item.grams * item.quantity), 0) / 1000; // in kg
    
    // Build the service description
    let description = `Optimized shipping for ${totalWeight.toFixed(2)}kg in ${parcels.length} ${parcels.length === 1 ? 'parcel' : 'parcels'}`;
    
    // Add delivery time information if available
    if (bestCarrier.deliveryTime) {
      description += ` (Delivery: ${bestCarrier.deliveryTime} days)`;
    }
    
    // Format the response as expected by Shopify
    const shippingRate = {
      service_name: `${bestCarrier.name} (${parcels.length} ${parcels.length === 1 ? 'parcel' : 'parcels'})`,
      service_code: bestCarrier.name.toLowerCase().replace(/\s+/g, '_'),
      total_price: Math.round(bestCarrier.totalCost),
      description: description,
      currency: bestCarrier.currency || "USD",
    };
    
    console.log("Returning shipping rate:", shippingRate);
    
    // Return the rates to Shopify
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