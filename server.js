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

const PROXY_TIMEOUT_MS = Number.parseInt(process.env.PROXY_TIMEOUT_MS || "120000", 10);
const UPSTREAM_CHECK_TIMEOUT_MS = Number.parseInt(
  process.env.UPSTREAM_CHECK_TIMEOUT_MS || "30000",
  10
);

app.use(
  "/bmtc",
  createProxyMiddleware({
    target: "https://bmtcmobileapi.karnataka.gov.in",
    changeOrigin: true,
    secure: true,
    agent: httpsAgent,
    timeout: PROXY_TIMEOUT_MS,
    proxyTimeout: PROXY_TIMEOUT_MS,
    pathRewrite: {
      "^/bmtc": "",
    },
    onError: (err, req, res) => {
      console.error(
        "Proxy error:",
        req.method,
        req.originalUrl,
        "->",
        err && (err.code || err.message || err)
      );
      if (res.headersSent) return;
      res.status(502).json({
        error: "Bad Gateway",
        message: "Upstream BMTC API request failed",
        details: err && (err.code || err.message) ? String(err.code || err.message) : undefined,
      });
    },
  })
);

app.get("/_upstream-check", (req, res) => {
  const startedAt = Date.now();
  const url = "https://bmtcmobileapi.karnataka.gov.in";

  const request = https.request(
    url,
    {
      method: "HEAD",
      agent: httpsAgent,
      timeout: UPSTREAM_CHECK_TIMEOUT_MS,
    },
    (upstreamRes) => {
      upstreamRes.resume();
      res.json({
        ok: true,
        url,
        statusCode: upstreamRes.statusCode,
        durationMs: Date.now() - startedAt,
      });
    }
  );

  request.on("timeout", () => {
    request.destroy(new Error("UPSTREAM_TIMEOUT"));
  });

  request.on("error", (err) => {
    res.status(502).json({
      ok: false,
      url,
      error: err && err.message ? err.message : String(err),
      code: err && err.code ? String(err.code) : undefined,
      durationMs: Date.now() - startedAt,
    });
  });

  request.end();
});

app.get("/", (req, res) => {
  res.send("BMTC Proxy is running 🚀");
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
