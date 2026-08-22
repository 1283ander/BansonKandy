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

function buildSystemInstructionText(targetLanguage: string, customStyle: string): string {
  const baseInstruction =
    "You are an elite, real-time cross-lingual voice translation engine with a strict 'Meaning-Mirroring & Congruency' philosophy. Your goal is to map user speech input into the target language while perfectly mirroring its original tonality, emotional prosody, register, humor, and level of explicitness/vulgarity. Do not translate literally; translate idiomatically and contextually. Follow this additional user style instruction closely during translation:";

  const defaultStyle = `Translate English input into ${targetLanguage || "Khmer"} and non-English input into English. Keep translation natural, conversational, and direct.`;
  const effectiveStyle = customStyle?.trim()
    ? `${customStyle.trim()} (Target language: ${targetLanguage || "Khmer"})`
    : defaultStyle;

  return `${baseInstruction} ${effectiveStyle}`;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json({ limit: "20mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // REST Translation Fallback Endpoint with multi-tier model fallback and retry
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLanguage = "Khmer", customStyle = "" } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing text to translate" });
      }

      const ai = getAI();
      const styleClause = customStyle ? `Follow this style closely: ${customStyle}.` : "";
      const prompt = `You are an elite cross-lingual voice translation engine.
If the following text is in English, translate it to ${targetLanguage}.
If the text is in any other language, translate it to English.
Mirror original tonality, humor, register, and vulgarity. ${styleClause}
Return ONLY the translation without quotes or commentary.

Text: ${text}`;

      // Use valid and fast models from @google/genai specification
      const modelsToTry = [
        "gemini-3.7-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite",
      ];
      let lastError: any = null;
      let translatedText = "";

      for (const model of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              temperature: 0.1,
            },
          });
          translatedText = response.text?.trim() || "";
          if (translatedText) break;
        } catch (err: any) {
          console.warn(`Model ${model} translation error:`, err?.message || err);
          lastError = err;
          // Continue to next fallback model
          continue;
        }
      }

      if (!translatedText && lastError) {
        throw lastError;
      }

      res.json({ translatedText });
    } catch (err: any) {
      console.error("HTTP translate error:", err);
      const isHighDemand =
        err?.status === "UNAVAILABLE" ||
        err?.message?.includes("503") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("spikes in demand");

      const errorMessage = isHighDemand
        ? "The AI model is experiencing a temporary spike in demand. Please try again in a few seconds."
        : err?.message || "Translation failed";

      res.status(isHighDemand ? 503 : 500).json({ error: errorMessage });
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
      targetLang: string,
      voiceName: string = "Puck",
      customStyle: string = ""
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
        const selectedVoice = voiceName || "Sulafat";
        const systemInstruction = buildSystemInstructionText(targetLang, customStyle);

        // BidiGenerateContentSetup configuration using models/gemini-3.1-flash-live-preview
        liveSession = await ai.live.connect({
          model: "models/gemini-3.1-flash-live-preview",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: selectedVoice,
                },
              },
            },
            systemInstruction: {
              parts: [
                {
                  text: systemInstruction,
                },
              ],
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
              voiceName: selectedVoice,
              customStyle,
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
            payload.targetLanguage || "Khmer",
            payload.voiceName || payload.voice || "Sulafat",
            payload.customStyle || ""
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
