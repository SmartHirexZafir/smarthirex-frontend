import * as React from "react";
import { HTMLAttributes } from "react";
import { cn } from "../../lib/util";

/**
 * Global Card primitives (Neon Eclipse)
 * - Uses ONLY global classes (.card, border-border, etc.)
 * - Forward refs for composition
 * - No local styling that conflicts with global tokens
 */

export const Card = React.forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} role="group" className={cn("card", className)} {...props} />;
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("px-6 pt-6 pb-2 flex items-center justify-between gap-3", className)}
        {...props}
      />
    );
  }
);
CardHeader.displayName = "CardHeader";

export const CardContent = React.forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("px-6 pb-6", className)} {...props} />;
  }
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("px-6 pb-6 pt-2 border-t border-border", className)}
        {...props}
      />
    );
  }
);
CardFooter.displayName = "CardFooter";
