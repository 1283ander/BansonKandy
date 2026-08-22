import { useState, useRef, useEffect, useCallback } from "react";
import { ConnectionState, TranslationTurn } from "../types";
import {
  float32To16BitPCM,
  arrayBufferToBase64,
  resampleTo16kHz,
  LiveAudioPlayer,
} from "../utils/audio";

interface UseLiveAudioOptions {
  targetLanguage: string;
  voiceName: string;
  customStyle: string;
}

export function useLiveAudio({
  targetLanguage,
  voiceName,
  customStyle,
}: UseLiveAudioOptions) {
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

  // References to track latest configurations
  const targetLanguageRef = useRef(targetLanguage);
  targetLanguageRef.current = targetLanguage;

  const voiceNameRef = useRef(voiceName);
  voiceNameRef.current = voiceName;

  const customStyleRef = useRef(customStyle);
  customStyleRef.current = customStyle;

  // Track previous configurations to detect changes during active sessions
  const prevConfigRef = useRef({ targetLanguage, voiceName, customStyle });

  // Cleanup all audio resources and sockets
  const cleanupAudio = useCallback((keepPlayer: boolean = false) => {
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
    if (!keepPlayer && playerRef.current) {
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

      // Buffer size 2048 gives responsive continuous stream
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
        // Send initial setup handshake with voice and custom style configuration
        ws.send(
          JSON.stringify({
            type: "start",
            targetLanguage: targetLanguageRef.current,
            voiceName: voiceNameRef.current,
            customStyle: customStyleRef.current,
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
            setErrorMessage(msg.message || "Live API session encountered an error.");
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

      // 5. Stream PCM chunks from microphone to WebSocket
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

  // Requirement 4: Whenever the user updates voiceName, customStyle, or targetLanguage,
  // cleanly tear down the active WebSocket session and re-establish a new handshake using the updated configuration
  useEffect(() => {
    const prev = prevConfigRef.current;
    const hasChanged =
      prev.targetLanguage !== targetLanguage ||
      prev.voiceName !== voiceName ||
      prev.customStyle !== customStyle;

    if (hasChanged) {
      prevConfigRef.current = { targetLanguage, voiceName, customStyle };

      const isActive =
        connectionState === "connected" ||
        connectionState === "translating" ||
        connectionState === "speaking" ||
        connectionState === "connecting";

      if (isActive) {
        // Clean teardown and immediate re-handshake
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try {
            wsRef.current.send(JSON.stringify({ type: "stop" }));
          } catch {
            // ignore
          }
        }
        cleanupAudio(true);
        startSession();
      }
    }
  }, [targetLanguage, voiceName, customStyle, connectionState, cleanupAudio, startSession]);

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
    clearHistory: () => setTranslations([]),
    addManualTurn: (text: string) => {
      if (!text.trim()) return;
      setTranslations((hist) => [
        ...hist,
        {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date(),
          speaker: "model",
          text: text.trim(),
        },
      ]);
    },
  };
}
