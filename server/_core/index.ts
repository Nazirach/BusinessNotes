import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Health endpoints are intentionally dependency-light so GitHub/deploy platforms
  // can verify the process before exercising authenticated application routes.
  app.get("/healthz", (_req, res) => {
    res.status(200).json({ ok: true, service: "businessnotes" });
  });
  app.get("/readyz", async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ ok: false, ready: false, reason: "database_unavailable" });
      return res.status(200).json({ ok: true, ready: true });
    } catch {
      return res.status(503).json({ ok: false, ready: false, reason: "database_unavailable" });
    }
  });
  app.get("/robots.txt", (_req, res) => {
    const base = process.env.PUBLIC_APP_URL || `${_req.protocol}://${_req.get("host")}`;
    res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${base}/sitemap.xml\n`);
  });
  app.get("/sitemap.xml", async (_req, res) => {
    const base = process.env.PUBLIC_APP_URL || `${_req.protocol}://${_req.get("host")}`;
    const urls = [`${base}/`, `${base}/news`, `${base}/article`];
    try {
      const { listPublishedNews } = await import("../db");
      const news = await listPublishedNews();
      for (const item of news) urls.push(`${base}/news/${item.id}`);
    } catch { /* keep sitemap usable even when DB is unavailable */ }
    const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${url}</loc></url>`).join("")}</urlset>`;
    res.type("application/xml").send(body);
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Render and similar platforms require the public server to bind to all interfaces.
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
