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
      expires: session.expires,
      scope: session.scope?.substring(0, 20) + "..." // Log partial scope for debugging
    });
    return this.storage.storeSession(session);
  }

  async loadSession(id) {
    const session = await this.storage.loadSession(id);
    console.log("LOADING SESSION:", {
      id,
      found: !!session,
      shop: session?.shop,
      hasToken: !!session?.accessToken,
      scope: session?.scope?.includes("write_shipping") ? "has write_shipping" : "missing write_shipping"
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

// Load API key and secret from environment variables or use defaults for development
const apiKey = process.env.SHOPIFY_API_KEY || "923a2370d32ef8ec9424ed8ab53e8bd0";
const apiSecret = process.env.SHOPIFY_API_SECRET || "";

// Get app URL from environment or default to the one in the config
const appUrl = process.env.SHOPIFY_APP_URL || "";

console.log("App configuration:", {
  apiKey: apiKey.substring(0, 6) + "...", // Log partial key for security
  hasSecret: !!apiSecret,
  apiVersion: ApiVersion.January25,
  appUrl,
  isProduction: process.env.NODE_ENV === "production"
});

const shopify = shopifyApp({
  apiKey,
  apiSecretKey: apiSecret,
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES || "write_products,write_shipping",
  appUrl,
  authPathPrefix: "/auth",
  sessionStorage: debugSessionStorage,
  distribution: AppDistribution.AppStore,
  isEmbeddedApp: true,
  hooks: {
    afterAuth: async ({ session }) => {
      console.log("AFTER AUTH HOOK:", {
        shop: session.shop,
        hasToken: !!session.accessToken,
        scope: session.scope
      });
      
      // Verify that we have the necessary scopes
      if (!session.scope.includes("write_shipping")) {
        console.warn("Session is missing write_shipping scope!", {
          shop: session.shop,
          scope: session.scope
        });
      }
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: false, // Set to false for stability
    removeRest: true,
  },
});

// Verify app installation and check if a shop has a valid session
export const verifyAppInstallation = async (request, shop = null) => {
  try {
    const { admin, session } = await shopify.authenticate.admin(request);
    
    // Check if session exists and has required data
    if (!session || !session.shop || !session.accessToken) {
      console.error("Invalid session:", { 
        exists: !!session,
        hasShop: !!session?.shop,
        hasToken: !!session?.accessToken
      });
      return { installed: false, admin: null, session: null };
    }
    
    // If a specific shop was requested, verify it matches
    if (shop && session.shop !== shop) {
      console.error("Shop mismatch:", {
        requestedShop: shop,
        sessionShop: session.shop
      });
      return { installed: false, admin: null, session: null };
    }
    
    try {
      // Verify the session by making a simple GraphQL query
      const response = await admin.graphql(`
        query {
          shop {
            name
          }
        }
      `);
      
      const result = await response.json();
      console.log("Shop verification result:", result?.data?.shop);
      
      if (result?.data?.shop?.name) {
        console.log(`App is installed for shop: ${session.shop}`);
        return { installed: true, admin, session };
      }
    } catch (error) {
      console.error("Error verifying app installation:", error);
    }
    
    console.log(`App is not properly installed for shop: ${session.shop}`);
    return { installed: false, admin, session };
  } catch (error) {
    console.error("Error authenticating admin session:", error);
    return { installed: false, admin: null, session: null };
  }
};

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;