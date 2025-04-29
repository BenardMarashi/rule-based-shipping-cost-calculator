// app/services/shipping-calculator.server.js
import { getCarriers } from "../models/carrier.server";

/**
 * Split items into parcels based on weight constraints
 * @param {Array} items - Order items with weight and quantity
 * @param {Number} maxWeight - Maximum weight per parcel in grams
 * @returns {Array} - Array of parcels with items
 */
export function splitParcels(items, maxWeight) {
  // Sort items by weight in descending order (heavier items first)
  const sortedItems = [...items].sort((a, b) => (b.grams * b.quantity) - (a.grams * a.quantity));
  
  // Initialize result and tracking variables
  const parcels = [];
  let currentParcel = { items: [], weight: 0 };
  let itemsProcessed = new Map(); // Track processed items
  
  // First pass: handle items exceeding max weight individually
  for (const item of sortedItems) {
    const itemId = item.id || item.variant_id;
    const itemWeight = item.grams;
    
    // If the individual item exceeds max weight, it needs special handling
    if (itemWeight > maxWeight) {
      console.log(`Item ${itemId} exceeds max weight: ${itemWeight}g > ${maxWeight}g`);
      // Create one parcel per item in this case
      for (let i = 0; i < item.quantity; i++) {
        parcels.push({
          items: [{ ...item, quantity: 1 }],
          weight: itemWeight
        });
      }
      // Mark this item as fully processed
      itemsProcessed.set(itemId, item.quantity);
    }
  }
  
  // Second pass: bin packing for remaining items
  for (const item of sortedItems) {
    const itemId = item.id || item.variant_id;
    const itemWeight = item.grams;
    
    // Skip items that are already processed
    if (itemsProcessed.has(itemId)) {
      continue;
    }
    
    // Process each item quantity
    let remainingQuantity = item.quantity;
    
    while (remainingQuantity > 0) {
      // If adding one more would exceed weight limit, start a new parcel
      if (currentParcel.weight + itemWeight > maxWeight) {
        if (currentParcel.items.length > 0) {
          parcels.push(currentParcel);
          currentParcel = { items: [], weight: 0 };
        }
      }
      
      // Try to add as many of this item as possible to the current parcel
      const maxFit = Math.min(
        remainingQuantity,
        Math.floor((maxWeight - currentParcel.weight) / itemWeight)
      );
      
      if (maxFit > 0) {
        // Add item to current parcel
        const itemToAdd = { ...item, quantity: maxFit };
        currentParcel.items.push(itemToAdd);
        currentParcel.weight += (itemWeight * maxFit);
        remainingQuantity -= maxFit;
      } else {
        // Create a new parcel if we can't fit any in the current one
        if (currentParcel.items.length > 0) {
          parcels.push(currentParcel);
          currentParcel = { items: [], weight: 0 };
        } else {
          // This should not happen with valid data, but just in case
          console.error(`Cannot fit item ${itemId} in any parcel!`);
          break;
        }
      }
    }
  }
  
  // Add the last parcel if it has items
  if (currentParcel.items.length > 0) {
    parcels.push(currentParcel);
  }
  
  // Post-processing: try to optimize parcel distribution
  optimizeParcels(parcels, maxWeight);
  
  console.log(`Split order into ${parcels.length} parcels`);
  return parcels;
}

/**
 * Optimize parcel distribution to minimize the number of parcels
 * @param {Array} parcels - Array of parcels with items and weights
 * @param {Number} maxWeight - Maximum weight per parcel
 */
function optimizeParcels(parcels, maxWeight) {
  // Sort parcels by weight (lighter first for better filling)
  parcels.sort((a, b) => a.weight - b.weight);
  
  // Try to merge parcels if possible
  for (let i = 0; i < parcels.length - 1; i++) {
    for (let j = i + 1; j < parcels.length; j++) {
      // If these two parcels can be combined, do it
      if (parcels[i].weight + parcels[j].weight <= maxWeight) {
        // Merge items
        parcels[i].items = [...parcels[i].items, ...parcels[j].items];
        parcels[i].weight += parcels[j].weight;
        
        // Remove the merged parcel
        parcels.splice(j, 1);
        
        // Restart the process to find more opportunities
        i = -1;
        break;
      }
    }
  }
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
    console.log("No carriers configured, using default shipping rate");
    return {
      name: "Standard Shipping",
      totalCost: 1000, // $10.00
      currency: "USD"
    };
  }
  
  const carrierCosts = carriers.map(carrier => {
    let totalCost = 0;
    let eligibleParcels = [];
    let oversizedParcels = [];
    
    // Check each parcel against this carrier's weight limit
    parcels.forEach(parcel => {
      const weightKg = parcel.weight / 1000; // Convert grams to kg
      
      // If parcel is within this carrier's weight limit
      if (weightKg <= carrier.maxWeight) {
        const parcelCost = carrier.baseCost + (weightKg * carrier.costPerKg);
        totalCost += parcelCost;
        eligibleParcels.push(parcel);
      } else {
        // This carrier can't handle this parcel
        oversizedParcels.push(parcel);
      }
    });
    
    // Only consider this carrier if all parcels can be handled
    const isEligible = oversizedParcels.length === 0;
    
    return {
      carrierId: carrier.id,
      name: carrier.name,
      totalCost,
      eligibleParcels,
      oversizedParcels,
      numberOfParcels: parcels.length,
      isEligible,
      currency: "USD" // Default currency
    };
  });
  
  // Filter for carriers that can handle all parcels
  const eligibleCarriers = carrierCosts.filter(carrier => carrier.isEligible);
  
  if (eligibleCarriers.length === 0) {
    console.log("No eligible carriers found for these parcels");
    // Default to a simple fixed rate if no eligible carriers
    return {
      name: "Standard Shipping",
      totalCost: 1500, // $15.00 - higher than normal to account for oversized parcels
      currency: "USD"
    };
  }
  
  // Find the carrier with lowest cost
  const bestCarrier = eligibleCarriers.sort((a, b) => a.totalCost - b.totalCost)[0];
  console.log(`Selected carrier: ${bestCarrier.name} with cost ${bestCarrier.totalCost}`);
  
  return bestCarrier;
}