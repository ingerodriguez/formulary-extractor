import express from "express";
import fetch from "node-fetch";
import pdf from "pdf-parse";

const app = express();
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Formulary extractor service running" });
});

// Main extractor route
app.get("/extract", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "Missing ?url= parameter" });
    }

    console.log("Fetching PDF:", url);
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(400).json({ error: `Failed to fetch PDF (${response.status})` });
    }

    const buffer = await response.arrayBuffer();
    const data = await pdf(Buffer.from(buffer));
    const text = data.text || "";

    const keywords = ["apixaban", "eliquis", "metformin", "atorvastatin"];
    const found = keywords.filter(k => text.toLowerCase().includes(k.toLowerCase()));

    res.json({
      status: "ok",
      url,
      text_length: text.length,
      found,
      snippet: text.slice(0, 800)
    });
  } catch (err) {
    console.error("Error extracting:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Extractor running on port ${PORT}`));
