// app/models/carrier.server.js
import prisma from "../db.server";

export async function getCarriers() {
  return prisma.carrier.findMany();
}

export async function getCarrierById(id) {
  return prisma.carrier.findUnique({
    where: { id }
  });
}

export async function createCarrier({ name, maxWeight, baseCost, costPerKg }) {
  return prisma.carrier.create({
    data: {
      name,
      maxWeight,
      baseCost,
      costPerKg
    }
  });
}

export async function updateCarrier(id, { name, maxWeight, baseCost, costPerKg }) {
  return prisma.carrier.update({
    where: { id },
    data: {
      name,
      maxWeight,
      baseCost,
      costPerKg
    }
  });
}

export async function deleteCarrier(id) {
  return prisma.carrier.delete({
    where: { id }
  });
}