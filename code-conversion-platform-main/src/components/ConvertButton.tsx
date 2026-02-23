import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConvertButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ConvertButton({ onClick, isLoading = false, disabled = false }: ConvertButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "group relative flex items-center justify-center gap-3 w-full py-4 px-6",
        "bg-primary text-primary-foreground font-semibold text-lg rounded-lg",
        "transition-all duration-300",
        "hover:glow-primary hover:scale-[1.02]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none",
        "active:scale-[0.98]"
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Converting...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
          <span>Convert Code</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </>
      )}
    </button>
  );
}
