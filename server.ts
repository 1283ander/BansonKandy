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
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
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
Your sole purpose is to translate speech back and forth instantaneously with flawless conversational fluidity, natural rhythm, authentic accents, and realistic prosody.

Configured target language for English speech: ${targetLanguage || "Spanish"}

STRICT OPERATIONAL RULES:
1. BIDIRECTIONAL LANGUAGE ROUTING:
   - If the user speaks in English: Instantly translate their words into ${targetLanguage || "Spanish"}.
   - If the user speaks in ANY language other than English (for example Spanish, French, Japanese, German, Mandarin, Italian, Portuguese, Arabic, Russian, Korean, Hindi, etc.): Instantly translate their words into English.
2. FIDELITY & REGISTER MATCHING:
   - Mirror the exact emotional tone, volume, cadence, hesitation, laughter, informality, slang, idioms, profanity, vulgarity, or explicitness of the original speaker.
   - Do NOT censor, soften, sanitize, embellish, or moralize the input. Maintain the exact nuance, intensity, and natural sounding prosody of the original speaker.
3. STRICT PROHIBITION (TRANSLATION ONLY):
   - You MUST NEVER engage in conversational dialogue with the user.
   - You MUST NEVER answer questions asked by the user, provide advice, or offer commentary.
   - You MUST NEVER prefix or suffix your response with meta-phrases like "The translation is:", "In English that means:", "Here you go:", etc.
   - You MUST NEVER introduce yourself, greet the user, or add novel thoughts.
   - You must ALWAYS and ONLY output the translated speech in voice.`;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json());

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // WebSocket Server for Gemini Live Realtime Audio Streaming
  const wss = new WebSocketServer({ server, path: "/api/live" });

  wss.on("connection", (clientWs: WebSocket) => {
    console.log("Client connected to /api/live");

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
            outputAudioTranscription: {},
            inputAudioTranscription: {},
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
                    message: err?.message || "Live API error occurred.",
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
              message: err?.message || "Failed to initialize Gemini Live session.",
            })
          );
        }
      }
    }

    clientWs.on("message", async (data: Buffer | string) => {
      try {
        const payload = JSON.parse(data.toString());

        if (payload.type === "start") {
          await initLiveSession(payload.targetLanguage || "Spanish", payload.voice || "Zephyr");
        } else if (payload.type === "update_target") {
          await initLiveSession(payload.targetLanguage || "Spanish", payload.voice || "Zephyr");
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
