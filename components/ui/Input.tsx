import * as React from "react";
import { cn } from "../../lib/util";

/** Optional common field-state props */
type FieldState = {
  /** Mark field in an error state; string shows helper text below the field */
  error?: boolean | string;
  /** Mark field as successful (subtle green ring) */
  success?: boolean;
};

export const Label = ({
  className,
  children,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) => (
  <label
    className={cn("block text-sm font-medium mb-1 text-foreground", className)}
    {...props}
  >
    {children}
    {required && (
      <>
        <span aria-hidden className="text-[hsl(var(--destructive))] ml-0.5">
          *
        </span>
        <span className="sr-only"> (required)</span>
      </>
    )}
  </label>
);

/** Helper text (neutral) */
export const FieldHint = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("mt-1 text-xs text-muted-foreground", className)}
    {...props}
  >
    {children}
  </p>
);

/** Error text (destructive) */
export const FieldError = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => {
  if (!children) return null;
  return (
    <p
      className={cn(
        "mt-1 text-xs text-[hsl(var(--destructive))]",
        className
      )}
      role="alert"
      {...props}
    >
      {children}
    </p>
  );
};

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & FieldState
>(({ className, error, success, ...props }, ref) => {
  const invalid =
    props["aria-invalid"] === true ||
    props["aria-invalid"] === "true" ||
    !!error;

  return (
    <>
      <input
        ref={ref}
        className={cn(
          "input",
          invalid &&
            "border-[hsl(var(--destructive)/.5)] ring-1 ring-[hsl(var(--destructive)/.25)] focus:ring-[hsl(var(--destructive))] focus:ring-offset-2",
          !invalid &&
            success &&
            "border-[hsl(var(--success)/.45)] ring-1 ring-[hsl(var(--success)/.25)] focus:ring-[hsl(var(--success))] focus:ring-offset-2",
          className
        )}
        aria-invalid={invalid || undefined}
        {...props}
      />
      {typeof error === "string" && <FieldError>{error}</FieldError>}
    </>
  );
});
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldState
>(({ className, error, success, ...props }, ref) => {
  const invalid =
    props["aria-invalid"] === true ||
    props["aria-invalid"] === "true" ||
    !!error;

  return (
    <>
      <textarea
        ref={ref}
        className={cn(
          "textarea",
          invalid &&
            "border-[hsl(var(--destructive)/.5)] ring-1 ring-[hsl(var(--destructive)/.25)] focus:ring-[hsl(var(--destructive))] focus:ring-offset-2",
          !invalid &&
            success &&
            "border-[hsl(var(--success)/.45)] ring-1 ring-[hsl(var(--success)/.25)] focus:ring-[hsl(var(--success))] focus:ring-offset-2",
          className
        )}
        aria-invalid={invalid || undefined}
        {...props}
      />
      {typeof error === "string" && <FieldError>{error}</FieldError>}
    </>
  );
});
Textarea.displayName = "Textarea";

export function Select({
  className,
  children,
  error,
  success,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & FieldState) {
  const describedBy = props["aria-describedby"];
  const invalid =
    props["aria-invalid"] === true ||
    props["aria-invalid"] === "true" ||
    !!error;

  return (
    <div className="relative">
      <select
        className={cn(
          "select appearance-none",
          invalid &&
            "border-[hsl(var(--destructive)/.5)] ring-1 ring-[hsl(var(--destructive)/.25)] focus:ring-[hsl(var(--destructive))] focus:ring-offset-2",
          !invalid &&
            success &&
            "border-[hsl(var(--success)/.45)] ring-1 ring-[hsl(var(--success)/.25)] focus:ring-[hsl(var(--success))] focus:ring-offset-2",
          className
        )}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M7 10l5 5 5-5"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      {typeof error === "string" && <FieldError>{error}</FieldError>}
    </div>
  );
}
