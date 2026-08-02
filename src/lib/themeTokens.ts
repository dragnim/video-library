import { dev } from "./env";

/**
 * The Elementor kit tokens app.css binds to. Elementor defines them on the
 * body's kit class, so that is where they are read from.
 */
const BOUND_TOKENS = [
  "--e-global-color-primary",
  "--e-global-color-secondary",
  "--e-global-color-text",
  "--e-global-color-accent",
];

/**
 * Warn when a bound token resolves to nothing, which means the app is running
 * on its fallbacks and the palette has quietly stopped following the site.
 * dvl has three references in that state and nobody noticed.
 */
export function checkThemeTokens(): void {
  if (!dev) return;

  const styles = getComputedStyle(document.body);
  const missing = BOUND_TOKENS.filter(
    (token) => styles.getPropertyValue(token).trim() === "",
  );

  if (missing.length > 0) {
    console.warn(
      `Elementor tokens not resolving, using fallbacks: ${missing.join(", ")}`,
    );
  }
}
