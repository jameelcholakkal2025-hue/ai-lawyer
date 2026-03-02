import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ==============================
// Health Check Route
// ==============================
app.get("/", (req, res) => {
  res.json({
    status: "✅ Gemini Legal AI Server Running",
  });
});

// ==============================
// Legal AI Endpoint
// ==============================
app.post("/legal-ai", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({
      error: "Message is required and must be a string.",
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured.",
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are a helpful Indian legal assistant. 
Provide only general legal information, not professional advice.
Keep answers clear and structured.

User Question: ${message}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return res.status(response.status).json(data);
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from AI.";

    res.json({
      success: true,
      reply: reply,
    });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate AI response.",
    });
  }
});

// ==============================
// 404 Handler
// ==============================
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// ==============================
// Start Server (Render Compatible)
// ==============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
