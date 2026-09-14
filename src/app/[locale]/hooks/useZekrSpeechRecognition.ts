"use client";
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Minimal typings for the Web Speech API (SpeechRecognition).
 * TypeScript's lib.dom doesn't ship these yet, and support is
 * currently Chrome/Edge/Safari (desktop + Android). No support in Firefox.
 */
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
}
interface SpeechRecognitionErrorEventLike extends Event {
  error?: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\u0600-\u06FF\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type UseZekrSpeechRecognitionArgs = {
  targetPhrase: string;
  active: boolean;
  locale?: string;
  onMatch: (times: number) => void;
};

const MIN_RESTART_DELAY_MS = 250;
const MAX_RESTART_DELAY_MS = 3000;

export function useZekrSpeechRecognition({
  targetPhrase,
  active,
  locale = "ar-EG",
  onMatch,
}: UseZekrSpeechRecognitionArgs) {
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string>("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const targetRef = useRef(normalizeArabic(targetPhrase));
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(MIN_RESTART_DELAY_MS);

  useEffect(() => {
    targetRef.current = normalizeArabic(targetPhrase);
  }, [targetPhrase]);

  const stop = useCallback(() => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    const SpeechRecognitionImpl =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognitionImpl) {
      setIsSupported(false);
      return;
    }

    if (!active) {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      return;
    }

    let stopped = false;
    backoffRef.current = MIN_RESTART_DELAY_MS;

    const createAndStart = () => {
      if (stopped) return;

      const recognition = new SpeechRecognitionImpl();
      recognition.lang = locale;
      recognition.continuous = true;
      // We no longer need interim results — we only ever count a *finalized*
      // segment, and only once per segment, no matter how many times the
      // phrase appears inside it. This avoids a known browser quirk where a
      // final transcript can come back with the phrase duplicated internally
      // (reporting far more repetitions than were actually said).
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        backoffRef.current = MIN_RESTART_DELAY_MS;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result.isFinal) continue;

          const heard = normalizeArabic(result[0].transcript);
          if (targetRef.current && heard.includes(targetRef.current)) {
            // Exactly one match per finalized segment — regardless of how
            // many times the phrase might appear to occur in the text.
            onMatch(1);
          }
        }
      };

      recognition.onerror = (event) => {
        const code = event.error;
        if (code === "no-speech" || code === "aborted") return;
        setError(code || "microphone-error");
      };

      recognition.onend = () => {
        if (stopped) return;
        if (recognitionRef.current !== recognition) return;
        restartTimerRef.current = setTimeout(() => {
          backoffRef.current = Math.min(backoffRef.current * 1.5, MAX_RESTART_DELAY_MS);
          createAndStart();
        }, backoffRef.current);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        restartTimerRef.current = setTimeout(createAndStart, backoffRef.current);
      }
    };

    createAndStart();

    return () => {
      stopped = true;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, locale]);

  return { isSupported, error, stop };
}