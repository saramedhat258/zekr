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

// Counts non-overlapping occurrences of `needle` inside `haystack`.
function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

type UseZekrSpeechRecognitionArgs = {
  targetPhrase: string;
  active: boolean;
  locale?: string;
  onMatch: (times: number) => void;
};

const MIN_RESTART_DELAY_MS = 250;
const MAX_RESTART_DELAY_MS = 3000;
// A single finalized speech segment realistically shouldn't contain more
// than a handful of repetitions said in one breath. Chrome occasionally has
// a bug where a "final" result comes back with the phrase duplicated
// internally (e.g. reporting 16 matches when the user only said it 3 times).
// Capping how much a single segment can add protects against that glitch
// without needing to know its exact cause, while still allowing genuine
// back-to-back repetitions (up to this limit) to count correctly.
const MAX_MATCHES_PER_SEGMENT = 33;

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
      // We only ever act on *finalized* segments — no interim results — to
      // avoid the earlier bug where an interim match and its later final
      // confirmation could both fire and stack on top of each other.
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        backoffRef.current = MIN_RESTART_DELAY_MS;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result.isFinal) continue;

          const heard = normalizeArabic(result[0].transcript);
          const occurrences = countOccurrences(heard, targetRef.current);
          if (occurrences > 0) {
            onMatch(Math.min(occurrences, MAX_MATCHES_PER_SEGMENT));
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