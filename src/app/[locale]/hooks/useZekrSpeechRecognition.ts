"use client";
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Minimal typings for the Web Speech API (SpeechRecognition).
 * TypeScript's lib.dom doesn't ship these yet, and support is
 * currently Chrome/Edge/Safari (desktop + Android). No support in Firefox.
 */
interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
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
const CONFIRM_DELAY_MS = 150;
const MIN_CONFIDENCE = 0.55;
// A single recognizer result should never plausibly represent more than a
// handful of repetitions said in one breath. Chrome occasionally has a bug
// where a "final" result comes back with the phrase duplicated internally
// (e.g. reporting 16 matches when the user only said it 3 times). Capping
// how much a single event can add protects against that glitch without
// needing to know its exact cause.
const MAX_MATCHES_PER_EVENT = 4;

export function useZekrSpeechRecognition({
  targetPhrase,
  active,
  locale = "ar-EG",
  onMatch,
}: UseZekrSpeechRecognitionArgs) {
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string>("");
  // TEMPORARY DEBUG FIELDS — remove once the counting issue is fully resolved.
  const [lastHeard, setLastHeard] = useState<string>("");
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const targetRef = useRef(normalizeArabic(targetPhrase));

  // These are intentionally NOT reset on every automatic restart (only when
  // the whole listening session is stopped/started by the user) — a natural
  // pause that causes the browser to end and restart the recognizer should
  // not erase progress the user has already made toward saying the phrase.
  const finalizedTextRef = useRef("");
  const confirmedCountRef = useRef(0);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(MIN_RESTART_DELAY_MS);

  useEffect(() => {
    targetRef.current = normalizeArabic(targetPhrase);
  }, [targetPhrase]);

  const clearPendingTimer = () => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
  };

  const stop = useCallback(() => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    clearPendingTimer();
    recognitionRef.current?.stop();
  }, []);

  const commitMatch = (times: number) => {
    // Never let a single burst add more than a sane number of repetitions.
    const clamped = Math.min(times, MAX_MATCHES_PER_EVENT);
    onMatch(clamped);
  };

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
      clearPendingTimer();
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      return;
    }

    let stopped = false;
    backoffRef.current = MIN_RESTART_DELAY_MS;

    // Reset progress ONCE per activation (user pressing "start"), not on
    // every automatic restart — see the comment on the refs above.
    finalizedTextRef.current = "";
    confirmedCountRef.current = 0;
    clearPendingTimer();

    const createAndStart = () => {
      if (stopped) return;

      const recognition = new SpeechRecognitionImpl();
      recognition.lang = locale;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        backoffRef.current = MIN_RESTART_DELAY_MS;

        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const alt = result[0];

          // TEMPORARY DEBUG — show exactly what the engine heard + its
          // confidence, live on screen.
          setLastHeard(alt.transcript);
          setLastConfidence(
            typeof alt.confidence === "number" ? alt.confidence : null
          );

          const hasMeaningfulConfidence =
            typeof alt.confidence === "number" && alt.confidence > 0;
          const passesConfidence = !hasMeaningfulConfidence || alt.confidence >= MIN_CONFIDENCE;

          if (!passesConfidence) {
            continue;
          }

          const heard = normalizeArabic(alt.transcript);

          if (result.isFinal) {
            finalizedTextRef.current = `${finalizedTextRef.current} ${heard}`.trim();
            clearPendingTimer();
            const total = countOccurrences(finalizedTextRef.current, targetRef.current);
            if (total > confirmedCountRef.current) {
              const delta = total - confirmedCountRef.current;
              commitMatch(delta);
              // Even if we clamped what we reported, treat the full total as
              // "seen" so we don't re-report the clamped-off remainder later.
              confirmedCountRef.current = total;
            }
          } else {
            interimText = heard;
          }
        }

        if (interimText) {
          const combined = `${finalizedTextRef.current} ${interimText}`.trim();
          const total = countOccurrences(combined, targetRef.current);

          clearPendingTimer();
          if (total > confirmedCountRef.current) {
            pendingTimerRef.current = setTimeout(() => {
              pendingTimerRef.current = null;
              if (total > confirmedCountRef.current) {
                const delta = total - confirmedCountRef.current;
                commitMatch(delta);
                confirmedCountRef.current = total;
              }
            }, CONFIRM_DELAY_MS);
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
      clearPendingTimer();
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, locale]);

  // lastHeard/lastConfidence are TEMPORARY — for diagnosing counting issues.
  return { isSupported, error, stop, lastHeard, lastConfidence };
}