import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

function buildSystemInstruction(
  mode: "single" | "dual",
  langA: string,
  langB: string
): string {
  if (mode === "single") {
    return `You are a strict linguistic mirror. Listen to the user and translate their speech into the target language. You must perfectly preserve the user's exact register, grammatical correctness, socio-economic dialect, and level of vulgarity. If the user uses creative profanity, mispronunciations, or uneducated vulgate syntax, you must find the exact connotative and semiotic analogue in the target language that conveys the same meaning, tone, and social marker. Do not sanitize, correct, or polite-ify the input.

Target Language: ${langB || "Khmer"}.
Output ONLY the spoken translated speech.`;
  } else {
    return `You are a bilingual mediator for two users speaking different languages. Listen to the input, detect which of the two languages was spoken, and automatically translate it into the other language. You are a strict linguistic mirror. You must perfectly preserve the speaker's exact register, grammatical correctness, socio-economic dialect, and level of vulgarity. If a speaker uses creative profanity, mispronunciations, or uneducated vulgate syntax, you must find the exact connotative and semiotic analogue in the target language that conveys the same meaning, tone, and social marker. Do not sanitize, correct, or polite-ify the input.

The two languages in this conversation are:
- Language 1: ${langA || "English"}
- Language 2: ${langB || "Khmer"}

When Language 1 is spoken, immediately translate it into Language 2.
When Language 2 is spoken, immediately translate it into Language 1.
Maintain fluid turn-taking and output ONLY the spoken translated speech.`;
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json({ limit: "20mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // REST Translation Fallback Endpoint
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLanguage = "Khmer", mode = "single", sourceLanguage = "English" } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing text to translate" });
      }

      const ai = getAI();
      const prompt = mode === "dual"
        ? `You are a bilingual mediator for two users speaking ${sourceLanguage} and ${targetLanguage}.
You are a strict linguistic mirror. You must perfectly preserve the speaker's exact register, grammatical correctness, socio-economic dialect, and level of vulgarity. If a speaker uses creative profanity, mispronunciations, or uneducated vulgate syntax, you must find the exact connotative and semiotic analogue in the target language that conveys the same meaning, tone, and social marker. Do not sanitize, correct, or polite-ify the input.

Translate this text into the other language:
"${text}"
Return ONLY the raw translation.`
        : `You are a strict linguistic mirror. Listen to the user and translate their speech into ${targetLanguage}. You must perfectly preserve the user's exact register, grammatical correctness, socio-economic dialect, and level of vulgarity. If the user uses creative profanity, mispronunciations, or uneducated vulgate syntax, you must find the exact connotative and semiotic analogue in the target language that conveys the same meaning, tone, and social marker. Do not sanitize, correct, or polite-ify the input.

Text to translate:
"${text}"
Return ONLY the raw translation.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT" as any, threshold: "BLOCK_NONE" as any },
            { category: "HARM_CATEGORY_HATE_SPEECH" as any, threshold: "BLOCK_NONE" as any },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any, threshold: "BLOCK_NONE" as any },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any, threshold: "BLOCK_NONE" as any },
          ],
        },
      });

      const translatedText = response.text?.trim() || "";
      res.json({ translatedText });
    } catch (err: any) {
      console.error("HTTP translate error:", err);
      res.status(500).json({ error: err?.message || "Translation failed" });
    }
  });

  // WebSocket Server for Gemini Live Realtime Audio Streaming
  const wss = new WebSocketServer({ noServer: true });

  wss.on("error", (err) => {
    console.error("WebSocketServer error:", err);
  });

  server.on("upgrade", (request, socket, head) => {
    try {
      const host = request.headers.host || "localhost";
      const parsedUrl = new URL(request.url || "", `http://${host}`);
      const pathname = parsedUrl.pathname;

      if (pathname === "/api/live" || pathname === "/api/live/") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      }
    } catch (err) {
      console.error("Upgrade handler error:", err);
      socket.destroy();
    }
  });

  wss.on("connection", (clientWs: WebSocket) => {
    console.log("Client connected to /api/live WebSocket");

    clientWs.on("error", (err) => {
      console.error("Client WebSocket error:", err);
    });

    let liveSession: any = null;
    let isConnecting = false;

    async function initLiveSession(
      mode: "single" | "dual" = "single",
      langA: string = "English",
      langB: string = "Khmer",
      voiceName: string = "Zephyr"
    ) {
      if (liveSession) {
        try {
          await liveSession.close();
        } catch {
          // ignore cleanup errors
        }
        liveSession = null;
      }

      try {
        isConnecting = true;
        const ai = getAI();
        const systemInstruction = buildSystemInstruction(mode, langA, langB);

        // Required models/gemini-2.0-flash-exp with responseModalities AUDIO and BLOCK_NONE safety settings
        liveSession = await ai.live.connect({
          model: "models/gemini-2.0-flash-exp",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || "Zephyr" },
              },
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT" as any,
                threshold: "BLOCK_NONE" as any,
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH" as any,
                threshold: "BLOCK_NONE" as any,
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any,
                threshold: "BLOCK_NONE" as any,
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any,
                threshold: "BLOCK_NONE" as any,
              },
            ],
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              if (clientWs.readyState !== WebSocket.OPEN) return;

              // Audio response
              const audioPart = message.serverContent?.modelTurn?.parts?.find(
                (p: any) => p.inlineData?.data
              );
              if (audioPart?.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: "audio",
                    audio: audioPart.inlineData.data,
                  })
                );
              }

              // Text / Transcription response
              const textPart = message.serverContent?.modelTurn?.parts?.find(
                (p: any) => p.text
              );
              if (textPart?.text) {
                clientWs.send(
                  JSON.stringify({
                    type: "model_text",
                    text: textPart.text,
                  })
                );
              }

              // Interrupted by user speaking
              if (message.serverContent?.interrupted) {
                clientWs.send(
                  JSON.stringify({
                    type: "interrupted",
                  })
                );
              }

              // Turn complete (session remains open continuously for fluid turns)
              if (message.serverContent?.turnComplete) {
                clientWs.send(
                  JSON.stringify({
                    type: "turn_complete",
                  })
                );
              }
            },
            onclose: () => {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: "session_closed" }));
              }
            },
            onerror: (err: any) => {
              console.error("Gemini Live Session Error:", err);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: "error",
                    message: err?.message || "Live API session encountered an error.",
                  })
                );
              }
            },
          },
        });

        isConnecting = false;
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: "ready",
              mode,
              languageA: langA,
              languageB: langB,
            })
          );
        }
      } catch (err: any) {
        isConnecting = false;
        console.error("Failed to start Live session:", err);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: "error",
              message:
                err?.message ||
                "Failed to initialize Gemini Live. Check your API key in Settings.",
            })
          );
        }
      }
    }

    clientWs.on("message", async (data: Buffer | string) => {
      try {
        const payload = JSON.parse(data.toString());

        if (payload.type === "start" || payload.type === "update_config") {
          await initLiveSession(
            payload.mode || "single",
            payload.languageA || payload.sourceLanguage || "English",
            payload.languageB || payload.targetLanguage || "Khmer",
            payload.voice || "Zephyr"
          );
        } else if (payload.type === "audio") {
          if (liveSession && !isConnecting) {
            liveSession.sendRealtimeInput({
              audio: {
                data: payload.audio,
                mimeType: "audio/pcm;rate=16000",
              },
            });
          }
        } else if (payload.type === "stop") {
          if (liveSession) {
            try {
              await liveSession.close();
            } catch {
              // ignore
            }
            liveSession = null;
          }
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: "stopped" }));
          }
        }
      } catch (e) {
        console.error("Error processing client message:", e);
      }
    });

    clientWs.on("close", async () => {
      console.log("Client disconnected from /api/live");
      if (liveSession) {
        try {
          await liveSession.close();
        } catch {
          // ignore
        }
        liveSession = null;
      }
    });
  });

  // Vite middleware in dev mode, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Live Voice Translator server running on http://localhost:${PORT}`);
  });
}

startServer();
