// app/models/carrier.server.js
import prisma from "../db.server";

/**
 * Get all carriers from the database
 * @returns {Promise<Array>} List of carriers
 */
export async function getCarriers() {
  try {
    return await prisma.carrier.findMany({
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
      where: { id }
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