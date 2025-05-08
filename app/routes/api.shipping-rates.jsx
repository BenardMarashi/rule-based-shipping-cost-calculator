// app/routes/api.shipping-rates.jsx
import { json } from "@remix-run/node";
import { splitParcels } from "../services/shipping-calculator.server";
import { getCarriers } from "../models/carrier.server";

// Add CORS headers to allow Shopify to access this endpoint
export const headers = ({ loaderHeaders, parentHeaders }) => {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Shopify-Access-Token",
    "Access-Control-Max-Age": "86400",
  };
};

// Handle OPTIONS requests for CORS preflight
export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Shopify-Access-Token",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Basic health check for GET requests
  return json({
    status: "ok",
    service: "shipping-cost-calculator",
    timestamp: new Date().toISOString()
  });
}

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
    // Log request method, headers, and content type for debugging
    console.log(`Received ${request.method} request to shipping rates endpoint`);
    console.log("Headers:", Object.fromEntries(request.headers.entries()));

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
          total_price: 1000, // €10.00
          description: "Standard shipping (no carriers configured)",
          currency: "EUR",
        }]
      });
    }
    
    // Initialize array for all shipping rates
    const shippingRates = [];
    
    // Calculate the total weight for display
    const totalWeight = items.reduce((sum, item) => sum + (item.grams * item.quantity), 0) / 1000; // in kg
    
    // Calculate rates for ALL carriers
    for (const carrier of carriers) {
      try {
        // Calculate parcels for this carrier
        const maxWeightForCarrier = carrier.maxWeight * 1000; // Convert to grams
        const parcelsForCarrier = splitParcels(items, maxWeightForCarrier);
        
        // Check if this carrier can handle all parcels
        let canHandleAllParcels = true;
        let totalCost = 0;
        let deliveryTime = null;
        
        // Look for country-specific rates
        const countryRate = carrier.countries?.find(c => c.countryCode === mappedCountryCode);
        
        // Process each parcel
        for (const parcel of parcelsForCarrier) {
          const weightKg = parcel.weight / 1000; // Convert grams to kg
          
          // Check if parcel exceeds carrier's weight limit
          if (weightKg > carrier.maxWeight) {
            canHandleAllParcels = false;
            break;
          }
          
          // Calculate cost for this parcel
          let parcelCost = 0;
          
          // If we have country-specific rates, use them
          if (countryRate && countryRate.weightRates && countryRate.weightRates.length > 0) {
            const weightRate = countryRate.weightRates.find(rate => 
              weightKg >= rate.minWeight && weightKg <= rate.maxWeight
            );
            
            if (weightRate) {
              parcelCost = weightRate.price;
              deliveryTime = countryRate.deliveryTime;
            } else {
              // Fallback to basic rate if we can't find a specific weight rate
              parcelCost = carrier.baseCost + (weightKg * carrier.costPerKg);
            }
          } else {
            // Use basic rate
            parcelCost = carrier.baseCost + (weightKg * carrier.costPerKg);
          }
          
          totalCost += parcelCost;
        }
        
        // Only add this carrier if it can handle all parcels
        if (canHandleAllParcels) {
          // Build service description
          let description = `${totalWeight.toFixed(2)}kg in ${parcelsForCarrier.length} ${parcelsForCarrier.length === 1 ? 'parcel' : 'parcels'}`;
          
          // Add delivery time information if available
          if (deliveryTime) {
            description += ` (Delivery: ${deliveryTime} days)`;
          }
          
          shippingRates.push({
            service_name: `${carrier.name} (${parcelsForCarrier.length} ${parcelsForCarrier.length === 1 ? 'parcel' : 'parcels'})`,
            service_code: carrier.name.toLowerCase().replace(/\s+/g, '_'),
            total_price: Math.round(totalCost),
            description: description,
            currency: "EUR",
          });
        }
      } catch (error) {
        console.error(`Error calculating rates for carrier ${carrier.name}:`, error);
      }
    }
    
    console.log(`Returning ${shippingRates.length} shipping rates`);
    
    // If no carrier can handle the order, return a fallback rate
    if (shippingRates.length === 0) {
      return json({ 
        rates: [{
          service_name: "Standard Shipping",
          service_code: "standard",
          total_price: 1500, // €15.00
          description: "Standard shipping (order exceeds carrier limits)",
          currency: "EUR",
        }] 
      });
    }
    
    // Sort rates by price (cheapest first)
    shippingRates.sort((a, b) => a.total_price - b.total_price);
    
    // Return all the rates to Shopify
    return json({ rates: shippingRates });
  } catch (error) {
    console.error("Error calculating shipping rates:", error);
    // Return a fallback rate to avoid breaking the checkout
    return json({ 
      rates: [{
        service_name: "Standard Shipping",
        service_code: "standard",
        total_price: 1000, // €10.00
        description: "Standard shipping (fallback)",
        currency: "EUR",
      }] 
    });
  }
}