const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const https = require("https");

const app = express();

app.use(cors());

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
});

app.use(
  "/bmtc",
  createProxyMiddleware({
    target: "https://bmtcmobileapi.karnataka.gov.in",
    changeOrigin: true,
    secure: true,
    agent: httpsAgent,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
      "^/bmtc": "",
    },
    onError: (err, req, res) => {
      console.error("Proxy error:", err && (err.code || err.message || err));
      if (res.headersSent) return;
      res.status(502).json({
        error: "Bad Gateway",
        message: "Upstream BMTC API request failed",
        details: err && (err.code || err.message) ? String(err.code || err.message) : undefined,
      });
    },
  })
);

app.get("/", (req, res) => {
  res.send("BMTC Proxy is running 🚀");
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
