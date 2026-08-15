import { useEffect, useState } from "react";

const STORAGE_KEY = "smarttask_theme";
const THEME_EVENT = "smarttask-theme-change";

function getCurrentTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY);

  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  const documentTheme =
    document.documentElement.getAttribute("data-theme");

  return documentTheme === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
  const root = document.documentElement;

  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme === "dark");
  document.body.classList.toggle("dark", theme === "dark");

  localStorage.setItem(STORAGE_KEY, theme);

  window.dispatchEvent(
    new CustomEvent(THEME_EVENT, {
      detail: theme,
    })
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getCurrentTheme);

  useEffect(() => {
    const handleThemeChange = (event) => {
      const nextTheme = event.detail;

      if (nextTheme === "dark" || nextTheme === "light") {
        setTheme(nextTheme);
      }
    };

    window.addEventListener(THEME_EVENT, handleThemeChange);

    return () => {
      window.removeEventListener(THEME_EVENT, handleThemeChange);
    };
  }, []);

  const handleThemeChange = (event, nextTheme) => {
    /*
     * The theme changes ONLY when one of the
     * actual Light/Dark buttons is clicked.
     */
    event.preventDefault();
    event.stopPropagation();

    if (theme === nextTheme) {
      return;
    }

    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <div
      className="theme-toggle"
      role="group"
      aria-label="Theme selection"
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      {/* Light mode */}
      <button
        type="button"
        className={`theme-option ${
          theme === "light" ? "active" : ""
        }`}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          handleThemeChange(event, "light");
        }}
        aria-label="Light mode"
        aria-pressed={theme === "light"}
      >
        ☀
      </button>

      {/* Dark mode */}
      <button
        type="button"
        className={`theme-option ${
          theme === "dark" ? "active" : ""
        }`}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          handleThemeChange(event, "dark");
        }}
        aria-label="Dark mode"
        aria-pressed={theme === "dark"}
      >
        ☾
      </button>
    </div>
  );
}