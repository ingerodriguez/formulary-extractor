import express from "express";
import fetch from "node-fetch";
import pdf from "pdf-parse";

const app = express();
app.use(express.json({ limit: "10mb" }));

// Root route - health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Formulary extractor running" });
});

// Main endpoint: extract text from PDF URL
app.get("/extract", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "Missing ?url= parameter" });
    }

    console.log("Downloading PDF from:", url);
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(400).json({ error: `Failed to fetch PDF: ${response.statusText}` });
    }

    const buffer = await response.arrayBuffer();
    const data = await pdf(Buffer.from(buffer));
    const text = data.text || "";

    // Basic info
    const contains = [];
    ["apixaban", "eliquis", "metformin", "atorvastatin"].forEach((kw) => {
      if (text.toLowerCase().includes(kw.toLowerCase())) contains.push(kw);
    });

    res.json({
      status: "ok",
      url,
      text_length: text.length,
      contains,
      sample: text.slice(0, 800),
    });
  } catch (err) {
    console.error("Error extracting PDF:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Extractor running on port ${PORT}`));
