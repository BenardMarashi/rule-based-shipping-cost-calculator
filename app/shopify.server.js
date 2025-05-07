import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

// Debug-enabled session storage wrapper
class DebugSessionStorage {
  constructor(storage) {
    this.storage = storage;
  }

  async storeSession(session) {
    console.log("STORING SESSION:", {
      shop: session.shop,
      hasToken: !!session.accessToken,
      expires: session.expires
    });
    return this.storage.storeSession(session);
  }

  async loadSession(id) {
    const session = await this.storage.loadSession(id);
    console.log("LOADING SESSION:", {
      id,
      found: !!session,
      shop: session?.shop,
      hasToken: !!session?.accessToken
    });
    return session;
  }

  async deleteSession(id) {
    console.log("DELETING SESSION:", { id });
    return this.storage.deleteSession(id);
  }

  async deleteSessions(ids) {
    console.log("DELETING SESSIONS:", { ids });
    return this.storage.deleteSessions(ids);
  }

  async findSessionsByShop(shop) {
    const sessions = await this.storage.findSessionsByShop(shop);
    console.log("FINDING SESSIONS BY SHOP:", {
      shop,
      found: sessions.length
    });
    return sessions;
  }
}

// Initialize with debugging session storage
const debugSessionStorage = new DebugSessionStorage(
  new PrismaSessionStorage(prisma)
);

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || "923a2370d32ef8ec9424ed8ab53e8bd0",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: "write_products,write_shipping",
  appUrl: process.env.SHOPIFY_APP_URL || "https://3.76.235.152",
  authPathPrefix: "/auth",
  sessionStorage: debugSessionStorage,
  distribution: AppDistribution.AppStore,
  isEmbeddedApp: true,
  hooks: {
    afterAuth: async ({ session }) => {
      console.log("AFTER AUTH HOOK:", {
        shop: session.shop,
        hasToken: !!session.accessToken
      });
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: false, // Changed to false for stability
    removeRest: true,
  },
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;