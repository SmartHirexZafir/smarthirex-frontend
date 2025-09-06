import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/util";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "soft"
  | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

/**
 * Global Button (Neon Eclipse)
 * - Uses ONLY global primitives (btn, btn-*), plus tokens for destructive
 * - Consistent padding, focus ring, and hover across the app
 * - Accessible loading states and keyboard/ARIA semantics
 */
const base = "btn";

/** Map variants to global classes (tokens from globals.css). */
const variants: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline: "btn-outline",
  ghost: "btn-ghost",
  soft: "btn-soft",

  // Destructive uses global tokens; we keep it here so pages don't style locally.
  destructive:
    "btn-outline text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/.45)] hover:bg-[hsl(var(--destructive)/.12)]",
};

/** Size scale shared across the codebase. */
const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "",
  lg: "px-6 py-3 text-base",
  icon:
    "h-10 w-10 p-0 inline-flex items-center justify-center aria-busy:cursor-wait",
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, type, ...props },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        "relative",
        loading && "cursor-wait",
        className
      )}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      data-variant={variant}
      {...props}
    >
      {/* spinner when loading */}
      {loading && (
        <span
          className={cn(
            "absolute inline-flex items-center",
            size === "icon" ? "inset-0 justify-center" : "left-3"
          )}
          aria-hidden="true"
        >
          <svg
            className="animate-spin-slow"
            width="16"
            height="16"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              opacity=".25"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </span>
      )}
      <span className={cn(loading && "opacity-60")}>{children}</span>
    </button>
  );
});

export default Button;
