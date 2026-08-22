import { useState, useRef, useEffect, useCallback } from "react";
import { AppMode, ConnectionState, TranslationTurn } from "../types";
import {
  float32To16BitPCM,
  arrayBufferToBase64,
  resampleTo16kHz,
  LiveAudioPlayer,
} from "../utils/audio";

interface UseLiveAudioOptions {
  mode: AppMode;
  languageA: string; // E.g. "English" or "Language 1"
  languageB: string; // E.g. "Khmer" or "Language 2"
  voice: string;
}

export function useLiveAudio({ mode, languageA, languageB, voice }: UseLiveAudioOptions) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userVolume, setUserVolume] = useState<number>(0);
  const [modelVolume, setModelVolume] = useState<number>(0);
  const [translations, setTranslations] = useState<TranslationTurn[]>([]);
  const [currentModelTurnText, setCurrentModelTurnText] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const playerRef = useRef<LiveAudioPlayer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const modeRef = useRef(mode);
  modeRef.current = mode;

  const languageARef = useRef(languageA);
  languageARef.current = languageA;

  const languageBRef = useRef(languageB);
  languageBRef.current = languageB;

  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  // Cleanup all audio contexts and sockets
  const cleanupAudio = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // ignore
      }
      processorRef.current = null;
    }
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== "closed") {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current = null;
    }
    if (wsRef.current) {
      try {
        if (
          wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING
        ) {
          wsRef.current.close();
        }
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
    setUserVolume(0);
    setModelVolume(0);
  }, []);

  const monitorMicVolume = useCallback((analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalized = Math.min(1, avg / 100);
      setUserVolume(normalized);
      animFrameIdRef.current = requestAnimationFrame(update);
    };
    animFrameIdRef.current = requestAnimationFrame(update);
  }, []);

  const startSession = useCallback(async () => {
    setErrorMessage(null);
    setConnectionState("connecting");

    try {
      // 1. Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Setup Web Audio Input Pipeline
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const inputCtx = new AudioContextClass();
      if (inputCtx.state === "suspended") {
        await inputCtx.resume();
      }
      inputAudioCtxRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      const analyser = inputCtx.createAnalyser();
      analyser.fftSize = 256;
      inputAnalyserRef.current = analyser;

      // Buffer size 2048 gives low-latency continuous stream
      const processor = inputCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      source.connect(analyser);
      analyser.connect(processor);
      processor.connect(inputCtx.destination);

      monitorMicVolume(analyser);

      // 3. Setup Audio Output Player
      playerRef.current = new LiveAudioPlayer((vol) => {
        setModelVolume(vol);
      });

      // 4. Connect WebSocket to the backend
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send start configuration with selected session mode and languages
        ws.send(
          JSON.stringify({
            type: "start",
            mode: modeRef.current,
            languageA: languageARef.current,
            languageB: languageBRef.current,
            voice: voiceRef.current,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "ready") {
            setConnectionState("connected");
          } else if (msg.type === "audio") {
            setConnectionState("translating");
            playerRef.current?.enqueueChunk(msg.audio);
          } else if (msg.type === "model_text") {
            setCurrentModelTurnText((prev) => prev + msg.text);
          } else if (msg.type === "interrupted") {
            playerRef.current?.interrupt();
            setModelVolume(0);
            setConnectionState("connected");
          } else if (msg.type === "turn_complete") {
            // Live WebSocket stays open continuously for turn-taking!
            setCurrentModelTurnText((prev) => {
              if (prev.trim()) {
                setTranslations((hist) => [
                  ...hist,
                  {
                    id: Math.random().toString(36).substring(2, 9),
                    timestamp: new Date(),
                    speaker: "model",
                    text: prev.trim(),
                  },
                ]);
              }
              return "";
            });
            setConnectionState("connected");
          } else if (msg.type === "error") {
            setErrorMessage(msg.message || "Live translation session encountered an error.");
            setConnectionState("error");
          } else if (msg.type === "session_closed" || msg.type === "stopped") {
            setConnectionState("disconnected");
          }
        } catch (err) {
          console.error("Error parsing WS message:", err);
        }
      };

      ws.onerror = () => {
        setErrorMessage("Live translation WebSocket connection could not be established.");
        setConnectionState("error");
      };

      ws.onclose = () => {
        setConnectionState((prev) =>
          prev === "connecting" || prev === "connected" || prev === "translating"
            ? "disconnected"
            : prev
        );
        cleanupAudio();
      };

      // 5. Stream PCM chunks continuously from microphone to WebSocket
      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const resampled = resampleTo16kHz(inputData, inputCtx.sampleRate);
          const pcmBuffer = float32To16BitPCM(resampled);
          const base64Audio = arrayBufferToBase64(pcmBuffer);

          ws.send(
            JSON.stringify({
              type: "audio",
              audio: base64Audio,
            })
          );
        }
      };
    } catch (err: any) {
      console.error("Failed to start voice session:", err);
      setErrorMessage(
        err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError"
          ? "Microphone access was denied. Please allow microphone permissions."
          : err?.message || "Could not start audio session."
      );
      setConnectionState("error");
      cleanupAudio();
    }
  }, [cleanupAudio, monitorMicVolume]);

  const stopSession = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: "stop" }));
      } catch {
        // ignore
      }
    }
    cleanupAudio();
    setConnectionState("disconnected");
    setCurrentModelTurnText("");
  }, [cleanupAudio]);

  const updateSessionConfig = useCallback(
    (newMode: AppMode, newLangA: string, newLangB: string, newVoice?: string) => {
      modeRef.current = newMode;
      languageARef.current = newLangA;
      languageBRef.current = newLangB;
      if (newVoice) voiceRef.current = newVoice;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "update_config",
            mode: newMode,
            languageA: newLangA,
            languageB: newLangB,
            voice: voiceRef.current,
          })
        );
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    connectionState,
    errorMessage,
    userVolume,
    modelVolume,
    translations,
    currentModelTurnText,
    startSession,
    stopSession,
    updateSessionConfig,
    clearHistory: () => setTranslations([]),
  };
}
