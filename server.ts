import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");

app.use(express.json());

// API routes for AI Analysis
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt in request body.' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
      return res.status(500).json({ 
        error: "Gemini API Key is not configured. Please add your key to the 'Secrets' or 'Environment Variables' section in the AI Studio Settings." 
      });
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash', 
      generationConfig: { responseMimeType: 'application/json' } 
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI response was not valid JSON.');
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    const { totalSpending, topCategory, insight, recommendation } = parsed;
    if (
      typeof totalSpending !== 'string' ||
      typeof topCategory !== 'string' ||
      typeof insight !== 'string' ||
      typeof recommendation !== 'string'
    ) {
      throw new Error('AI response does not contain the required analysis fields.');
    }

    res.json({ totalSpending, topCategory, insight, recommendation });
  } catch (error: any) {
    console.error('AI Analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze transactions' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
