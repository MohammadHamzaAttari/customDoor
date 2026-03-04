// server/index.ts — COMPLETE FIXED VERSION

import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";

// Load dotenv for local development (safe for both ESM and CJS)
try {
  if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("dotenv").config();
  }
} catch (e) {
  // dotenv not available — that's fine in production
}

const app = express();

/* ===============================
   Trust proxy (ALB / API Gateway)
================================ */
app.set("trust proxy", true);

/* ===============================
   Body parsing
================================ */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ===============================
   Request logging
================================ */
app.use((req, res, next) => {
  const start = Date.now();
  const pathReq = req.path;
  let capturedJsonResponse: unknown;

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    capturedJsonResponse = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    if (!pathReq.startsWith("/api")) return;

    const duration = Date.now() - start;
    let logLine = `${req.method} ${pathReq} ${res.statusCode} ${duration}ms`;

    if (capturedJsonResponse && process.env.NODE_ENV !== "production") {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }

    if (logLine.length > 200) {
      logLine = logLine.slice(0, 199) + "…";
    }

    console.log(logLine);
  });

  next();
});

/* ===============================
   Health check
================================ */
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    runtime: process.env.AWS_LAMBDA_FUNCTION_NAME ? "lambda" : "server",
    node: process.version,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

(async () => {
  /* ===============================
     Routes
  ================================ */
  const httpServer = await registerRoutes(app);

  /* ===============================
     Error handler
  ================================ */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("🔥 Unhandled error:", err);

    const status = err.statusCode || err.status || 500;
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message || "Internal Server Error";

    res.status(status).json({ message });
  });

  /* ===============================
     Standalone server only
  ================================ */
  const isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (!isLambda) {
    const PORT = Number(process.env.PORT || 5000);

    if (process.env.NODE_ENV === "production") {
      const clientPath = path.join(process.cwd(), "dist", "client");
      app.use(express.static(clientPath));

      // ✅ FIX: Use {*path} instead of * for Express 5 / path-to-regexp v8
      app.get("/{*path}", (req, res, next) => {
        if (req.path.startsWith("/api")) return next();
        res.sendFile(path.join(clientPath, "index.html"));
      });
    } else {
      // In development, setup Vite middleware AFTER routes
      const { setupVite } = await import("./vite");
      await setupVite(app, httpServer);
    }

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  }
})();

export { app };