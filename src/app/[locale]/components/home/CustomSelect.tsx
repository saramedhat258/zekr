"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const options = [
    {
        label: "Soft Chime",
        value: "/sounds/soft-chime.mp3",
    },
    {
        label: "Notification Tone",
        value: "/sounds/notification-tone.mp3",
    },
    {
        label: "Completion Tone",
        value: "/sounds/completion-tone.mp3",
    },
    {
        label: "Success Bell",
        value: "/sounds/success-bell.mp3",
    },
];

export default function CustomSelect({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selected =
        options.find((option) => option.value === value) ?? options[0];

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-2xl border border-main-biege bg-white p-3 text-lg text-zekr-gray"
            >
                {selected.label}

                <ChevronDown
                    className={`transition-transform ${open ? "rotate-180" : ""
                        }`}
                />
            </button>

            {open && (
                <ul className="absolute z-50 mt-2 w-full rounded-2xl border border-main-biege bg-white shadow-lg overflow-hidden">
                    {options.map((option) => (
                        <li
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                window.sessionStorage.setItem("ringtone", JSON.stringify(option.value))
                                setOpen(false);
                            }}
                            className="cursor-pointer px-4 py-3 transition-colors hover:bg-main-bg"
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}