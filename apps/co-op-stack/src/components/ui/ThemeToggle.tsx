import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={theme === "dark"}
      onClick={toggleTheme}

      className="inline-flex items-center justify-center rounded-lg border border-border bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover dark:border-border dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary-hover"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}

    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
