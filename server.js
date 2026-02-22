const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();

app.use(cors());

app.use(
  "/bmtc",
  createProxyMiddleware({
    target: "https://bmtcmobileapi.karnataka.gov.in",
    changeOrigin: true,
    secure: true,
    pathRewrite: {
      "^/bmtc": "",
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
