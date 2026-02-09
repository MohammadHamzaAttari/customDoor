import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { doorConfigSchema, cartItemSchema } from "@shared/doorSchema";
import { generateDoorDxf, type DxfDoorConfig } from "./dxfGenerator";
import { generateDoorSvg, type SvgDoorConfig } from "./svgGenerator";
import { z } from "zod";
import {
  insertCustomerSchema,
  insertOrderSchema,
  insertOrderItemSchema,
} from "@shared/schema";
import { createShopifyDraftOrder, createQuickCheckout } from "./shopify";
import { registerOAuthRoutes } from "./oauth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register OAuth Handlers
  registerOAuthRoutes(app);
  // =====================================================
  // CUSTOMER ENDPOINTS
  // =====================================================

  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      console.log(`[Customer API] POST received. RAW BODY:`, JSON.stringify(req.body, null, 2));
      const customerData = insertCustomerSchema.parse(req.body);
      console.log(`[Customer API] Parsed Customer Data:`, JSON.stringify(customerData, null, 2));

      // Check if customer already exists by email
      const existingCustomer = await storage.getCustomerByEmail(customerData.email);
      if (existingCustomer) {
        console.log(`[Customer API] Found existing customer ID: ${existingCustomer.id}. Updating...`);
        // Update details with latest info from form
        const updated = await storage.updateCustomer(existingCustomer.id, customerData);
        console.log(`[Customer API] Update result for ${updated?.email}: name=${updated?.contactName}, phone=${updated?.phone}`);
        return res.status(200).json(updated);
      }

      console.log(`[Customer API] Creating new customer for email: ${customerData.email}`);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error: any) {
      console.error(`[Customer API] Error:`, error.message);
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, customerData);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // =====================================================
  // DOOR STYLES ENDPOINTS
  // =====================================================

  app.get("/api/door-styles", async (req, res) => {
    try {
      const styles = await storage.getAllDoorStyles();
      res.json(styles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/door-styles/:code", async (req, res) => {
    try {
      const style = await storage.getDoorStyleByCode(req.params.code);
      if (!style) {
        return res.status(404).json({ message: "Door style not found" });
      }
      res.json(style);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // =====================================================
  // FINISH OPTIONS ENDPOINTS
  // =====================================================

  app.get("/api/finish-options", async (req, res) => {
    try {
      const finishes = await storage.getAllFinishOptions();
      res.json(finishes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/finish-options/:code", async (req, res) => {
    try {
      const finish = await storage.getFinishOptionByCode(req.params.code);
      if (!finish) {
        return res.status(404).json({ message: "Finish option not found" });
      }
      res.json(finish);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // =====================================================
  // ORDER ENDPOINTS
  // =====================================================

  app.get("/api/orders", async (req, res) => {
    try {
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
      const orders = customerId
        ? await storage.getOrdersByCustomer(customerId)
        : await storage.getAllOrders();
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Get order items
      const items = await storage.getOrderItemsByOrder(id);

      // Get hinges and mid rails for each item
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          const hinges = await storage.getHingesByItem(item.id);
          const midRails = await storage.getMidRailsByItem(item.id);
          return { ...item, hinges, midRails };
        })
      );

      res.json({ ...order, items: itemsWithDetails });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      console.log("POST /api/orders received:", req.body);
      const body = { ...req.body };
      if (typeof body.dateRequired === "string") {
        console.log("Converting dateRequired string to Date object:", body.dateRequired);
        body.dateRequired = new Date(body.dateRequired);
      }
      console.log("Parsed body before Zod:", { ...body, dateRequired: typeof body.dateRequired });
      const orderData = insertOrderSchema.parse(body);
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const body = { ...req.body };
      if (typeof body.dateRequired === "string") {
        body.dateRequired = new Date(body.dateRequired);
      }
      const orderData = insertOrderSchema.partial().parse(body);
      const order = await storage.updateOrder(id, orderData);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // =====================================================
  // ORDER ITEMS ENDPOINTS
  // =====================================================

  app.get("/api/orders/:orderId/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const items = await storage.getOrderItemsByOrder(orderId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/orders/:orderId/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const itemData = insertOrderItemSchema.parse({ ...req.body, orderId });
      const item = await storage.createOrderItem(itemData);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/order-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = insertOrderItemSchema.partial().parse(req.body);
      const item = await storage.updateOrderItem(id, itemData);
      if (!item) {
        return res.status(404).json({ message: "Order item not found" });
      }
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/order-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteOrderItem(id);
      if (!deleted) {
        return res.status(404).json({ message: "Order item not found" });
      }
      res.json({ message: "Order item deleted" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/order-items/:id/hinges", async (req, res) => {
    try {
      const orderItemId = parseInt(req.params.id);
      const hinge = await storage.createHinge({ ...req.body, orderItemId });
      res.status(201).json(hinge);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/order-items/:id/mid-rails", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const rail = await storage.createMidRail({ ...req.body, itemId });
      res.status(201).json(rail);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // =====================================================
  // PRICING ENDPOINTS
  // =====================================================

  app.get("/api/price-brackets/height", async (req, res) => {
    try {
      const brackets = await storage.getPriceBracketsHeight();
      res.json(brackets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/price-brackets/width", async (req, res) => {
    try {
      const brackets = await storage.getPriceBracketsWidth();
      res.json(brackets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/surcharges", async (req, res) => {
    try {
      const surcharges = await storage.getAllSurcharges();
      res.json(surcharges);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const calculatePriceSchema = z.object({
    heightMm: z.number().min(200).max(2430),
    widthMm: z.number().min(200).max(900),
    styleCode: z.string(),
    isAngled: z.boolean().default(false),
    panelType: z.string().default("STANDARD_12MM"),
    numMidRails: z.number().min(0).default(0),
    hingeQty: z.number().min(0).default(0),
    finish: z.string().default("RAW_UNASSEMBLED"),
  });

  app.post("/api/calculate-price", async (req, res) => {
    try {
      const params = calculatePriceSchema.parse(req.body);
      const price = await storage.calculateDoorPrice(params);
      res.json({ price });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // =====================================================
  // DELIVERY OPTIONS ENDPOINTS
  // =====================================================

  app.get("/api/delivery-options", async (req, res) => {
    try {
      const options = await storage.getAllDeliveryOptions();
      res.json(options);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // =====================================================
  // SYSTEM SETTINGS ENDPOINTS
  // =====================================================

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/settings/:key", async (req, res) => {
    try {
      const { value } = req.body;
      if (typeof value !== "string") {
        return res.status(400).json({ message: "Value must be a string" });
      }
      const setting = await storage.updateSetting(req.params.key, value);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // =====================================================
  // LEGACY ENDPOINTS (Door configuration and cart)
  // =====================================================

  app.post("/api/door-config", async (req, res) => {
    try {
      const config = doorConfigSchema.parse(req.body);
      const saved = await storage.saveDoorConfig(config);
      res.json(saved);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/door-config/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const config = await storage.getDoorConfig(id);
      if (!config) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Cart endpoints
  app.post("/api/cart", async (req, res) => {
    try {
      const itemData = {
        timestamp: new Date().toISOString(),
        config: doorConfigSchema.parse(req.body.config),
        quantity: req.body.quantity || 1,
      };
      const cartItem = await storage.addToCart(itemData);
      res.json(cartItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/cart", async (req, res) => {
    try {
      const items = await storage.getCartItems();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const removed = await storage.removeFromCart(id);
      if (!removed) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json({ message: "Item removed from cart" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      await storage.clearCart();
      res.json({ message: "Cart cleared" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // =====================================================
  // EXPORT ENDPOINTS (DXF/SVG)
  // =====================================================

  // =====================================================
  // EXPORT ENDPOINTS (DXF/SVG) - Token Based
  // =====================================================

  const { nanoid } = await import("nanoid");
  const exportCache = new Map<string, { type: "dxf" | "svg"; config: any; filename: string }>();

  // Clean up cache periodically (every 10 minutes)
  setInterval(() => {
    exportCache.clear();
  }, 10 * 60 * 1000);

  const dxfExportSchema = z.object({
    width: z.number(),
    height: z.number(),
    thickness: z.number(),
    preset: z.string(),
    panelType: z.string(),
    panelCount: z.number(),
    shape: z.string(),
    material: z.string(),
    finish: z.string(),
    rebateWidthMm: z.number(),
    rebateDepthMm: z.number(),
    frontFaceThicknessMm: z.number(),
    cornerRadiusMm: z.number(),
    angledLeft: z.boolean().optional(),
    angledRight: z.boolean().optional(),
    leftTriangleCutoutWidth: z.preprocess((val) => Number(val) || 0, z.number().optional()),
    leftTriangleCutoutHeight: z.preprocess((val) => Number(val) || 0, z.number().optional()),
    rightTriangleCutoutWidth: z.preprocess((val) => Number(val) || 0, z.number().optional()),
    rightTriangleCutoutHeight: z.preprocess((val) => Number(val) || 0, z.number().optional()),
    leftStile: z.number().optional(),
    rightStile: z.number().optional(),
    topRail: z.number().optional(),
    bottomRail: z.number().optional(),
    midRailsEnabled: z.boolean().optional(),
    midRails: z.array(z.any()).optional(),
    hinges: z.array(z.any()),
  }).passthrough();

  const svgExportSchema = z.object({
    width: z.number(),
    height: z.number(),
    thickness: z.number(),
    preset: z.string(),
    panelType: z.string(),
    panelCount: z.number(),
    panelOrientation: z.enum(["vertical", "horizontal"]).optional().default("vertical"),
    shape: z.string(),
    angledLeft: z.boolean().optional(),
    angledRight: z.boolean().optional(),
    leftTriangleCutoutWidth: z.preprocess((val) => Number(val) || 0, z.number().optional()),
    leftTriangleCutoutHeight: z.preprocess((val) => Number(val) || 0, z.number().optional()),
    rightTriangleCutoutWidth: z.preprocess((val) => Number(val) || 0, z.number().optional()),
    rightTriangleCutoutHeight: z.preprocess((val) => Number(val) || 0, z.number().optional()),
    borderWidth: z.number().optional(),
    customBorders: z.boolean().optional(),
    leftStile: z.number().optional(),
    rightStile: z.number().optional(),
    bottomRail: z.number().optional(),
    topRail: z.number().optional(),
    midRailsEnabled: z.boolean().optional(),
    midRails: z.array(z.any()).optional(),
    rebateWidthMm: z.number().optional(),
    rebateDepthMm: z.number().optional(),
    frontFaceThicknessMm: z.number().optional(),
    cornerRadiusMm: z.number().optional(),
    hingeDrilling: z.boolean().optional(),
    hinges: z.array(z.any()).optional(),
    material: z.string(),
    finish: z.string(),
  }).passthrough();

  app.post("/api/export/prepare", async (req, res) => {
    try {
      const type = req.query.type as string;
      if (type !== "dxf" && type !== "svg") {
        return res.status(400).json({ message: "Invalid export type" });
      }

      let parsedConfig;
      if (type === "dxf") {
        parsedConfig = dxfExportSchema.parse(req.body);
      } else {
        parsedConfig = svgExportSchema.parse(req.body);
      }

      const token = nanoid();
      const filename = `door-${parsedConfig.preset}-${parsedConfig.width}x${parsedConfig.height}-${Date.now()}.${type}`;

      exportCache.set(token, { type: type as "dxf" | "svg", config: parsedConfig, filename });
      res.json({ token });

    } catch (error: any) {
      console.error("Export Preparation Error:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation Error:", JSON.stringify(error.format(), null, 2));
      }
      res.status(422).json({
        message: "Failed to prepare export",
        details: error.message
      });
    }
  });

  app.get("/api/download/:type/:token", async (req, res) => {
    const { type, token } = req.params;
    const cached = exportCache.get(token);

    if (!cached || cached.type !== type) {
      return res.status(404).send("Link expired or invalid");
    }

    try {
      let content;
      if (type === "dxf") {
        const config: DxfDoorConfig = { ...cached.config, height: cached.config.height };
        content = generateDoorDxf(config);
        res.setHeader("Content-Type", "application/dxf");
      } else {
        const config: SvgDoorConfig = {
          ...cached.config,
          height: cached.config.height,
          borderWidth: cached.config.borderWidth ?? 75,
        };
        content = generateDoorSvg(config);
        res.setHeader("Content-Type", "image/svg+xml");
      }

      res.setHeader("Content-Disposition", `attachment; filename="${cached.filename}"`);
      res.send(content);

      // Optional: Clear cache after download (one-time use)
      exportCache.delete(token);

    } catch (error: any) {
      console.error("Download Generation Error:", error);
      res.status(500).send("Failed to generate file");
    }
  });

  // =====================================================
  // SHOPIFY INTEGRATION ENDPOINTS
  // =====================================================

  app.post("/api/orders/:id/sync-shopify", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await createShopifyDraftOrder(id);
      res.json(result);
    } catch (error: any) {
      console.error("Shopify Sync Route Error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/orders/:id/sync-logs", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const logs = await storage.getShopifySyncLogs(id);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Quick checkout - creates a Shopify draft order directly from door config
  app.post("/api/quick-checkout", async (req, res) => {
    try {
      const doorConfig = req.body;
      
      if (!doorConfig.width || !doorConfig.height || !doorConfig.price) {
        return res.status(400).json({ message: "Missing required door configuration" });
      }

      const result = await createQuickCheckout(doorConfig);
      res.json(result);
    } catch (error: any) {
      console.error("Quick Checkout Error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
