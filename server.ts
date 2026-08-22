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

function buildSystemInstruction(targetLanguage: string): string {
  return `You are an ultra-low-latency, real-time speech-to-speech conversational translator.
Your sole purpose is to translate speech back and forth instantaneously with natural rhythm, authentic accents, and realistic prosody.

Configured target language for English speech: ${targetLanguage || "Khmer"}

STRICT OPERATIONAL RULES:
1. BIDIRECTIONAL LANGUAGE ROUTING:
   - If the user speaks in English: Instantly translate their words into ${targetLanguage || "Khmer"}.
   - If the user speaks in ANY foreign language other than English (including Khmer, Vietnamese, Thai, Latin American Spanish, Mandarin Chinese, French, German, Japanese, Korean, Russian, etc.): Instantly translate their words into English.
2. FIDELITY & ACCURACY:
   - Mirror the exact emotional tone, volume, cadence, hesitation, laughter, and nuance of the original speaker.
   - Do NOT censor, soften, sanitize, or embellish. Maintain natural sounding colloquial phrasing and prosody.
3. TRANSLATION ONLY:
   - You MUST NEVER engage in dialogue with the user.
   - You MUST NEVER answer questions asked by the user or offer commentary.
   - You MUST NEVER prefix responses with phrases like "The translation is:", "In English:", etc.
   - Output ONLY the translated speech in voice.`;
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
      const { text, targetLanguage = "Khmer" } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing text to translate" });
      }

      const ai = getAI();
      const prompt = `You are an expert bidirectional translator. 
If the following text is in English, translate it to ${targetLanguage}.
If the text is in any language other than English, translate it to English.
Return ONLY the translation without any quotes or explanations.

Text: ${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
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

    async function initLiveSession(targetLang: string, voiceName: string = "Zephyr") {
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
        const systemInstruction = buildSystemInstruction(targetLang);

        liveSession = await ai.live.connect({
          model: "gemini-3.1-flash-live-preview",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || "Zephyr" },
              },
            },
            systemInstruction,
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

              // Turn complete
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
              targetLanguage: targetLang,
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

        if (payload.type === "start" || payload.type === "update_target") {
          await initLiveSession(payload.targetLanguage || "Khmer", payload.voice || "Zephyr");
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
