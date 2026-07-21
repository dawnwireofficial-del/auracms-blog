"use client";

import { useEffect } from "react";

type ClearButton1Props = {
    onClear: () => void;
};

const ClearButton1 = ({ onClear }: ClearButton1Props) => {
    const clearLocalStorage = () => {
        localStorage.removeItem("toggled");
    };

    useEffect(() => {
        const clear = () => {
            document.body.classList.remove("dark-theme");

            const input = document.querySelector(
                ".theme-dark-light .light input"
            ) as HTMLInputElement | null;

            if (input) {
                input.checked = true;
            }

            clearLocalStorage();
        };

        const clearButton = document.querySelector(
            ".form-theme-style .button-clear-select",
        );

        if (clearButton) {
            clearButton.addEventListener("click", clear);
        }

        return () => {
            if (clearButton) {
                clearButton.removeEventListener("click", clear);
            }
        };
    }, []);
    return (
        <button
            type="button"
            className="tf-button cursor-pointer w-full button-clear-select"
            onClick={onClear}
        >
            Clear all
        </button>
    );
};

export default ClearButton1;
