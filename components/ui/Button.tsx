import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/util";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "soft" | "destructive" | "google";
type Size = "sm" | "md" | "lg" | "icon";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base = "btn";
const variants: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline: "btn-outline",
  ghost: "btn-ghost",
  soft: "btn-soft",
  destructive: "btn-destructive",
  google: "btn-google",
};
const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "",
  lg: "px-6 py-3 text-base",
  icon: "h-10 w-10 p-0 inline-flex items-center justify-center",
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, ...props },
  ref
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], "relative", className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {/* spinner when loading */}
      {loading && (
        <span className="absolute left-3 inline-flex items-center" aria-hidden>
          <svg className="animate-spin-slow" width="16" height="16" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" opacity=".25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </span>
      )}
      <span className={cn(loading && "opacity-60")}>{children}</span>
    </button>
  );
});

export default Button;
