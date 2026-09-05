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

// Removes Arabic diacritics (tashkeel) and unifies common letter variants
// so that spoken text matches the reference dhikr text more reliably.
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // tashkeel + tatweel
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\u0600-\u06FF\s]/g, "") // keep Arabic letters + spaces only
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
  targetPhrase: string; // the dhikr's Arabic text to match against
  active: boolean; // whether listening should currently be running
  locale?: string; // "ar" locale code, defaults to ar-EG
  onMatch: (times: number) => void; // called with how many repetitions were detected
};

const MIN_RESTART_DELAY_MS = 250;
const MAX_RESTART_DELAY_MS = 3000;
// How long we wait, after seeing a new match in an *interim* (not-yet-final)
// result, before we actually count it. If the browser corrects itself within
// this window (e.g. it briefly misheard a repeated word), the correction
// arrives before this timer fires and the false match never gets counted.
const CONFIRM_DELAY_MS = 150;

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
  // How many matches have actually been committed (sent to onMatch) for a
  // given result index so far.
  const countedByIndexRef = useRef<Map<number, number>>(new Map());
  // Pending "confirm this match" timers per result index, used to debounce
  // interim results so a brief misrecognition doesn't get counted before
  // the browser has a chance to correct itself.
  const pendingTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(MIN_RESTART_DELAY_MS);

  useEffect(() => {
    targetRef.current = normalizeArabic(targetPhrase);
  }, [targetPhrase]);

  const clearPendingTimer = (index: number) => {
    const timer = pendingTimersRef.current.get(index);
    if (timer) {
      clearTimeout(timer);
      pendingTimersRef.current.delete(index);
    }
  };

  const stop = useCallback(() => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    pendingTimersRef.current.forEach((timer) => clearTimeout(timer));
    pendingTimersRef.current.clear();
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
      pendingTimersRef.current.forEach((timer) => clearTimeout(timer));
      pendingTimersRef.current.clear();
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      return;
    }

    let stopped = false;
    backoffRef.current = MIN_RESTART_DELAY_MS;

    const createAndStart = () => {
      if (stopped) return;

      countedByIndexRef.current = new Map();
      pendingTimersRef.current.forEach((timer) => clearTimeout(timer));
      pendingTimersRef.current.clear();

      const recognition = new SpeechRecognitionImpl();
      recognition.lang = locale;
      recognition.continuous = true;
      // Interim results let us react to speech *as it's being said*,
      // instead of waiting for the browser to decide the sentence is "final"
      // (which only happens after a pause, causing a noticeable delay).
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        // Got real audio activity — the connection is healthy, so reset backoff.
        backoffRef.current = MIN_RESTART_DELAY_MS;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const heard = normalizeArabic(result[0].transcript);
          const total = countOccurrences(heard, targetRef.current);
          const alreadyCounted = countedByIndexRef.current.get(i) || 0;

          // Any earlier pending confirmation for this index is now stale —
          // this new update replaces it (this is what lets a self-correction
          // from the browser cancel a previously-scheduled false match).
          clearPendingTimer(i);

          if (result.isFinal) {
            // Final results are authoritative — commit immediately, no need
            // to wait for a correction that will never come.
            if (total > alreadyCounted) {
              onMatch(total - alreadyCounted);
            }
            countedByIndexRef.current.delete(i);
            continue;
          }

          if (total > alreadyCounted) {
            const confirmedTotal = total;
            const timer = setTimeout(() => {
              pendingTimersRef.current.delete(i);
              const stillAlreadyCounted = countedByIndexRef.current.get(i) || 0;
              if (confirmedTotal > stillAlreadyCounted) {
                onMatch(confirmedTotal - stillAlreadyCounted);
                countedByIndexRef.current.set(i, confirmedTotal);
              }
            }, CONFIRM_DELAY_MS);
            pendingTimersRef.current.set(i, timer);
          }
        }
      };

      recognition.onerror = (event) => {
        const code = event.error;
        // "no-speech" fires often during natural pauses between dhikr
        // repetitions — it's not a real problem, so don't show an error,
        // just let onend restart listening quietly.
        if (code === "no-speech" || code === "aborted") return;
        setError(code || "microphone-error");
      };

      recognition.onend = () => {
        if (stopped) return;
        if (recognitionRef.current !== recognition) return; // superseded already
        // Some browsers reject an immediate restart. Waiting a small,
        // increasing delay avoids the silent failure that used to happen
        // when start() was called too soon after stop().
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
      pendingTimersRef.current.forEach((timer) => clearTimeout(timer));
      pendingTimersRef.current.clear();
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