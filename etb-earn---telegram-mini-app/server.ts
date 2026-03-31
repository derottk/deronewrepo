import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Telegram Auth Verification Middleware
  const verifyTelegramAuth = (req: any, res: any, next: any) => {
    const initData = req.headers['x-telegram-init-data'];
    if (!initData) return res.status(401).json({ error: "Unauthorized" });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return next(); // Skip if no token for dev

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    urlParams.sort();

    const dataCheckString = Array.from(urlParams.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (hmac === hash) {
      next();
    } else {
      res.status(401).json({ error: "Invalid Telegram Auth" });
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Monetag Callback (Postback)
  // Monetag sends a GET request to your postback URL
  // Example: /api/monetag/callback?uid={uid}&reward={reward}&click_id={click_id}
  app.get("/api/monetag/callback", async (req, res) => {
    const { uid, reward, click_id } = req.query;
    console.log(`Monetag Callback: uid=${uid}, reward=${reward}, click_id=${click_id}`);
    
    // In a real app, you'd verify the click_id and update the user's balance in Firestore
    // Since we can't directly access Firestore here easily without Firebase Admin,
    // we'll assume the frontend will handle the update or we'd use a service account.
    // For this demo, we'll just log it.
    
    res.send("OK");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
