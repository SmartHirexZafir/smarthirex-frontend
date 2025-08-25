import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/util";


type Variant = "primary" | "secondary" | "outline" | "ghost" | "soft" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";


interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
variant?: Variant;
size?: Size;
}


const base = "btn";
const variants: Record<Variant, string> = {
primary: "btn-primary",
secondary: "btn-secondary",
outline: "btn-outline",
ghost: "btn-ghost",
soft: "btn-soft",
destructive: "btn-destructive",
};
const sizes: Record<Size, string> = {
sm: "px-4 py-2 text-sm",
md: "",
lg: "px-6 py-3 text-base",
icon: "h-10 w-10 p-0 inline-flex items-center justify-center",
};


const Button = forwardRef<HTMLButtonElement, Props>(function Button(
{ className, variant = "primary", size = "md", ...props },
ref
) {
return (
<button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
);
});


export default Button;