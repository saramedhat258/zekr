"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
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

  useEffect(() => {
    targetRef.current = normalizeArabic(targetPhrase);
  }, [targetPhrase]);

  const stop = useCallback(() => {
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
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = locale;
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal) continue;
        const heard = normalizeArabic(result[0].transcript);
        const times = countOccurrences(heard, targetRef.current);
        if (times > 0) onMatch(times);
      }
    };

    recognition.onerror = () => {
      setError("microphone-error");
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {
          // ignore restart races
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError("microphone-error");
    }

    return () => {
      recognition.onend = null;
      recognition.stop();
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, locale]);

  return { isSupported, error, stop };
}