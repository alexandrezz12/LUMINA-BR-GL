import express from "express";

const proxyApp = express();

let realApp: any = null;
let loadError: any = null;

// Dynamically import the real server to catch any module-level execution errors
import("../server")
  .then((m) => {
    realApp = m.default || m;
    console.log("[Proxy] Real server loaded successfully!");
  })
  .catch((err) => {
    console.error("[Proxy] Failed to load real server:", err);
    loadError = err;
  });

proxyApp.all("*", (req, res, next) => {
  console.log(`[Proxy] Request: ${req.method} ${req.url} (originalUrl: ${req.originalUrl})`);

  if (loadError) {
    console.error("[Proxy] Returning cached initialization error to client:", loadError);
    return res.status(500).json({
      error: "Failed to initialize backend server",
      message: loadError.message || String(loadError),
      stack: loadError.stack,
      hint: "Check Firebase or Stripe environment variables in AI Studio / Vercel Settings.",
    });
  }

  if (!realApp) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (realApp) {
        clearInterval(interval);
        realApp(req, res, next);
      } else if (loadError) {
        clearInterval(interval);
        res.status(500).json({
          error: "Failed to initialize backend server during wait",
          message: loadError.message || String(loadError),
          stack: loadError.stack,
        });
      } else if (attempts > 50) { // 5 seconds timeout
        clearInterval(interval);
        res.status(503).json({
          error: "Backend server is still initializing. Please try again in a few seconds.",
        });
      }
    }, 100);
    return;
  }

  realApp(req, res, next);
});

export default proxyApp;

