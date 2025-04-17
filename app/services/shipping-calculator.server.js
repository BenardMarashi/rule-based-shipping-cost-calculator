// app/services/shipping-calculator.server.js
import { getCarriers } from "../models/carrier.server";

/**
 * Split items into parcels based on weight constraints
 * @param {Array} items - Order items with weight and quantity
 * @param {Number} maxWeight - Maximum weight per parcel in grams
 * @returns {Array} - Array of parcels with items
 */
export function splitParcels(items, maxWeight) {
  // Sort items by weight in descending order
  const sortedItems = [...items].sort((a, b) => (b.grams * b.quantity) - (a.grams * a.quantity));
  
  const parcels = [];
  let currentParcel = { items: [], weight: 0 };
  
  // First pass: try to fit items into parcels
  for (const item of sortedItems) {
    const itemWeight = item.grams * item.quantity;
    
    // If the item exceeds max weight, split it into multiple parcels
    if (itemWeight > maxWeight) {
      const itemsToSplit = Math.ceil(itemWeight / maxWeight);
      for (let i = 0; i < itemsToSplit; i++) {
        parcels.push({
          items: [{ ...item, quantity: 1 }],
          weight: item.grams
        });
      }
    } 
    // If the item fits in the current parcel, add it
    else if (currentParcel.weight + itemWeight <= maxWeight) {
      currentParcel.items.push(item);
      currentParcel.weight += itemWeight;
    } 
    // If it doesn't fit, create a new parcel
    else {
      if (currentParcel.items.length > 0) {
        parcels.push(currentParcel);
      }
      currentParcel = {
        items: [item],
        weight: itemWeight
      };
    }
  }
  
  // Add the last parcel if it has items
  if (currentParcel.items.length > 0) {
    parcels.push(currentParcel);
  }
  
  return parcels;
}

/**
 * Calculate shipping cost for all parcels per carrier
 * @param {Array} parcels - Array of parcels with weights
 * @returns {Object} - Carrier with lowest total cost
 */
export async function selectBestCarrier(parcels) {
  const carriers = await getCarriers();
  
  if (!carriers || carriers.length === 0) {
    // Default to a simple fixed rate if no carriers configured
    return {
      name: "Standard Shipping",
      totalCost: 1000, // $10.00
      currency: "USD"
    };
  }
  
  const carrierCosts = carriers.map(carrier => {
    let totalCost = 0;
    
    // Calculate cost for each parcel
    parcels.forEach(parcel => {
      const weightKg = parcel.weight / 1000;
      const parcelCost = carrier.baseCost + (weightKg * carrier.costPerKg);
      totalCost += parcelCost;
    });
    
    return {
      carrierId: carrier.id,
      name: carrier.name,
      totalCost,
      numberOfParcels: parcels.length,
      currency: "USD" // Default currency
    };
  });
  
  // Find the carrier with lowest cost
  return carrierCosts.sort((a, b) => a.totalCost - b.totalCost)[0];
}