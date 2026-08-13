import { useEffect, useState } from "react";

const STORAGE_KEY = "smarttask_theme";

function getInitialTheme() {
  const saved =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (
    saved === "dark" ||
    saved === "light"
  ) {
    return saved;
  }

  return window.matchMedia &&
    window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] =
    useState(getInitialTheme);

  useEffect(() => {
    const root =
      document.documentElement;

    root.setAttribute(
      "data-theme",
      theme
    );

    root.classList.toggle(
      "dark",
      theme === "dark"
    );

    document.body.classList.toggle(
      "dark",
      theme === "dark"
    );

    localStorage.setItem(
      STORAGE_KEY,
      theme
    );
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) =>
      current === "dark"
        ? "light"
        : "dark"
    );
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className="theme-toggle"
    >
      {theme === "dark"
        ? "☀️"
        : "🌙"}
    </button>
  );
}