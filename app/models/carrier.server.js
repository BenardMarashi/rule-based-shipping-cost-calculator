// app/models/carrier.server.js
import prisma from "../db.server";

/**
 * Get all carriers from the database with their country rates and weight rates
 * @returns {Promise<Array>} List of carriers
 */
export async function getCarriers() {
  try {
    return await prisma.carrier.findMany({
      include: {
        countries: {
          include: {
            weightRates: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  } catch (error) {
    console.error("Error retrieving carriers:", error);
    // Initialize with default carrier if none exist
    if (error.message.includes('does not exist in the current database')) {
      console.log("Carrier table doesn't exist, performing migration...");
      return [];
    }
    return [];
  }
}

/**
 * Get a carrier by ID
 * @param {string} id Carrier ID
 * @returns {Promise<Object|null>} Carrier object or null
 */
export async function getCarrierById(id) {
  try {
    return await prisma.carrier.findUnique({
      where: { id },
      include: {
        countries: {
          include: {
            weightRates: true
          }
        }
      }
    });
  } catch (error) {
    console.error(`Error retrieving carrier ${id}:`, error);
    return null;
  }
}

/**
 * Create a new carrier
 * @param {Object} data Carrier data
 * @param {string} data.name Carrier name
 * @param {number} data.maxWeight Maximum weight in kg
 * @param {number} data.baseCost Base cost in cents
 * @param {number} data.costPerKg Cost per kg in cents
 * @returns {Promise<Object>} Created carrier
 */
export async function createCarrier({ name, maxWeight, baseCost, costPerKg }) {
  // Validate inputs
  if (!name) throw new Error("Carrier name is required");
  if (isNaN(maxWeight) || maxWeight <= 0) throw new Error("Max weight must be a positive number");
  if (isNaN(baseCost) || baseCost < 0) throw new Error("Base cost must be a non-negative number");
  if (isNaN(costPerKg) || costPerKg < 0) throw new Error("Cost per kg must be a non-negative number");
  
  try {
    return await prisma.carrier.create({
      data: {
        name,
        maxWeight,
        baseCost,
        costPerKg
      }
    });
  } catch (error) {
    console.error("Error creating carrier:", error);
    throw new Error(`Failed to create carrier: ${error.message}`);
  }
}

/**
 * Update an existing carrier
 * @param {string} id Carrier ID
 * @param {Object} data Carrier data
 * @param {string} data.name Carrier name
 * @param {number} data.maxWeight Maximum weight in kg
 * @param {number} data.baseCost Base cost in cents
 * @param {number} data.costPerKg Cost per kg in cents
 * @returns {Promise<Object>} Updated carrier
 */
export async function updateCarrier(id, { name, maxWeight, baseCost, costPerKg }) {
  // Validate inputs
  if (!id) throw new Error("Carrier ID is required");
  if (!name) throw new Error("Carrier name is required");
  if (isNaN(maxWeight) || maxWeight <= 0) throw new Error("Max weight must be a positive number");
  if (isNaN(baseCost) || baseCost < 0) throw new Error("Base cost must be a non-negative number");
  if (isNaN(costPerKg) || costPerKg < 0) throw new Error("Cost per kg must be a non-negative number");
  
  try {
    return await prisma.carrier.update({
      where: { id },
      data: {
        name,
        maxWeight,
        baseCost,
        costPerKg
      }
    });
  } catch (error) {
    console.error(`Error updating carrier ${id}:`, error);
    throw new Error(`Failed to update carrier: ${error.message}`);
  }
}

/**
 * Delete a carrier by ID
 * @param {string} id Carrier ID
 * @returns {Promise<Object>} Deleted carrier
 */
export async function deleteCarrier(id) {
  if (!id) throw new Error("Carrier ID is required");
  
  try {
    return await prisma.carrier.delete({
      where: { id }
    });
  } catch (error) {
    console.error(`Error deleting carrier ${id}:`, error);
    throw new Error(`Failed to delete carrier: ${error.message}`);
  }
}

/**
 * Add a country rate to a carrier
 * @param {string} carrierId Carrier ID
 * @param {Object} data Country rate data
 * @param {string} data.countryCode Country code
 * @param {string} data.countryName Country name
 * @param {string} data.deliveryTime Delivery time
 * @returns {Promise<Object>} Created country rate
 */
export async function addCountryRate(carrierId, { countryCode, countryName, deliveryTime }) {
  if (!carrierId) throw new Error("Carrier ID is required");
  if (!countryCode) throw new Error("Country code is required");
  if (!countryName) throw new Error("Country name is required");
  
  try {
    return await prisma.countryRate.create({
      data: {
        carrierId,
        countryCode,
        countryName,
        deliveryTime
      }
    });
  } catch (error) {
    console.error(`Error adding country rate to carrier ${carrierId}:`, error);
    throw new Error(`Failed to add country rate: ${error.message}`);
  }
}

/**
 * Update a country rate
 * @param {string} id Country rate ID
 * @param {Object} data Country rate data
 * @param {string} data.countryCode Country code
 * @param {string} data.countryName Country name
 * @param {string} data.deliveryTime Delivery time
 * @returns {Promise<Object>} Updated country rate
 */
export async function updateCountryRate(id, { countryCode, countryName, deliveryTime }) {
  if (!id) throw new Error("Country rate ID is required");
  if (!countryCode) throw new Error("Country code is required");
  if (!countryName) throw new Error("Country name is required");
  
  try {
    return await prisma.countryRate.update({
      where: { id },
      data: {
        countryCode,
        countryName,
        deliveryTime
      }
    });
  } catch (error) {
    console.error(`Error updating country rate ${id}:`, error);
    throw new Error(`Failed to update country rate: ${error.message}`);
  }
}

/**
 * Delete a country rate
 * @param {string} id Country rate ID
 * @returns {Promise<Object>} Deleted country rate
 */
export async function deleteCountryRate(id) {
  if (!id) throw new Error("Country rate ID is required");
  
  try {
    return await prisma.countryRate.delete({
      where: { id }
    });
  } catch (error) {
    console.error(`Error deleting country rate ${id}:`, error);
    throw new Error(`Failed to delete country rate: ${error.message}`);
  }
}

/**
 * Add a weight rate to a country rate
 * @param {string} countryRateId Country rate ID
 * @param {Object} data Weight rate data
 * @param {number} data.minWeight Minimum weight
 * @param {number} data.maxWeight Maximum weight
 * @param {number} data.price Price in cents
 * @returns {Promise<Object>} Created weight rate
 */
export async function addWeightRate(countryRateId, { minWeight, maxWeight, price }) {
  if (!countryRateId) throw new Error("Country rate ID is required");
  if (isNaN(minWeight) || minWeight < 0) throw new Error("Minimum weight must be a non-negative number");
  if (isNaN(maxWeight) || maxWeight <= 0) throw new Error("Maximum weight must be a positive number");
  if (isNaN(price) || price < 0) throw new Error("Price must be a non-negative number");
  if (minWeight >= maxWeight) throw new Error("Minimum weight must be less than maximum weight");
  
  try {
    return await prisma.weightRate.create({
      data: {
        countryRateId,
        minWeight,
        maxWeight,
        price
      }
    });
  } catch (error) {
    console.error(`Error adding weight rate to country rate ${countryRateId}:`, error);
    throw new Error(`Failed to add weight rate: ${error.message}`);
  }
}

/**
 * Update a weight rate
 * @param {string} id Weight rate ID
 * @param {Object} data Weight rate data
 * @param {number} data.minWeight Minimum weight
 * @param {number} data.maxWeight Maximum weight
 * @param {number} data.price Price in cents
 * @returns {Promise<Object>} Updated weight rate
 */
export async function updateWeightRate(id, { minWeight, maxWeight, price }) {
  if (!id) throw new Error("Weight rate ID is required");
  if (isNaN(minWeight) || minWeight < 0) throw new Error("Minimum weight must be a non-negative number");
  if (isNaN(maxWeight) || maxWeight <= 0) throw new Error("Maximum weight must be a positive number");
  if (isNaN(price) || price < 0) throw new Error("Price must be a non-negative number");
  if (minWeight >= maxWeight) throw new Error("Minimum weight must be less than maximum weight");
  
  try {
    return await prisma.weightRate.update({
      where: { id },
      data: {
        minWeight,
        maxWeight,
        price
      }
    });
  } catch (error) {
    console.error(`Error updating weight rate ${id}:`, error);
    throw new Error(`Failed to update weight rate: ${error.message}`);
  }
}

/**
 * Delete a weight rate
 * @param {string} id Weight rate ID
 * @returns {Promise<Object>} Deleted weight rate
 */
export async function deleteWeightRate(id) {
  if (!id) throw new Error("Weight rate ID is required");
  
  try {
    return await prisma.weightRate.delete({
      where: { id }
    });
  } catch (error) {
    console.error(`Error deleting weight rate ${id}:`, error);
    throw new Error(`Failed to delete weight rate: ${error.message}`);
  }
}