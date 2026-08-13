import { Loader2 } from "lucide-react";
import { cx } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition",
        variant === "primary" &&
          "bg-brand-600 text-white shadow-sm hover:bg-brand-700 disabled:bg-gray-300",
        variant === "secondary" &&
          "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        variant === "ghost" &&
          "text-gray-600 hover:bg-gray-100",
        variant === "danger" &&
          "bg-red-600 text-white hover:bg-red-700",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
