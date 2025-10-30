// server.js — Formulary PDF Extractor Microservice
// Minimal Express server using pdf-parse to extract text from PDFs

import express from "express";
import { readFile } from "fs/promises";
import pdf from "pdf-parse";
import { fetch } from "undici";

const app = express();
app.use(express.json({ limit: "10mb" }));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ ok: true, service: "formulary-extractor", version: "1.0.0" });
});

// POST /extract
// Body: { url?: string, base64?: string }
app.post("/extract", async (req, res) => {
  try {
    const { url, base64 } = req.body;

    let pdfBuffer;
    if (url) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);
      pdfBuffer = Buffer.from(await response.arrayBuffer());
    } else if (base64) {
      pdfBuffer = Buffer.from(base64, "base64");
    } else {
      return res.status(400).json({ error: "Missing 'url' or 'base64' in request body" });
    }

    const data = await pdf(pdfBuffer);
    const text = data.text || "";

    res.json({
      success: true,
      length: text.length,
      preview: text.slice(0, 500),
      fullText: text
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Extractor running on port ${PORT}`);
});
