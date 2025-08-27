import { HTMLAttributes } from "react";
import { cn } from "../../lib/util";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="group" className={cn("card", className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pt-6 pb-2 flex items-center justify-between gap-3", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6 pt-2 border-t border-white/10", className)} {...props} />;
}
