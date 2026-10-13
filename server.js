
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = process.env.PORT || 3000;
const root = path.dirname(fileURLToPath(import.meta.url));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(root, "public")));

app.use("/api/", rateLimit({
  windowMs: 60 * 1000,
  limit: 20
}));

app.get("/api/health", (req, res) => {
  res.json({
    app: "YADAV JARVIS AI",
    status: "online",
    aiConfigured: Boolean(process.env.AI_API_KEY)
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.message;

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 4000
    ) {
      return res.status(400).json({
        error: "Please enter a valid message."
      });
    }

    const apiKey = process.env.AI_API_KEY;
    const apiUrl =
      process.env.AI_API_URL ||
      "https://api.openai.com/v1/chat/completions";
    const model = process.env.AI_MODEL || "gpt-4o-mini";

    if (!apiKey) {
      return res.status(503).json({
        error: "AI API key is not configured on the server."
      });
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are YADAV JARVIS AI. Help users with coding, learning and everyday questions. Support Nepali, Hindi and English. Reply in the user's language. Never claim to control a device unless an authorized integration actually performed the action."
          },
          {
            role: "user",
            content: message.trim()
          }
        ]
      }),
      signal: AbortSignal.timeout(45000)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("AI provider status:", response.status);
      return res.status(502).json({
        error: "AI request failed. Check API settings and usage limits."
      });
    }

    const answer = data?.choices?.[0]?.message?.content;

    if (typeof answer !== "string") {
      return res.status(502).json({
        error: "Unexpected AI response."
      });
    }

    res.json({ answer });
  } catch (error) {
    console.error("Backend error:", error.message);

    res.status(500).json({
      error: "Server error. Please try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(`YADAV JARVIS AI running on port ${PORT}`);
});
