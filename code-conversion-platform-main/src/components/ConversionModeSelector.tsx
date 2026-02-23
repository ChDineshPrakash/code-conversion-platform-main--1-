import { cn } from "@/lib/utils";

const modes = [
  {
    value: "strict",
    label: "Strict",
    description: "Line-by-line functional equivalence",
    icon: "🎯",
  },
  {
    value: "idiomatic",
    label: "Idiomatic",
    description: "Target language best practices",
    icon: "✨",
  },
  {
    value: "optimized",
    label: "Optimized",
    description: "Performance-focused conversion",
    icon: "⚡",
  },
];

interface ConversionModeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ConversionModeSelector({ value, onChange }: ConversionModeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Conversion Mode
      </label>
      <div className="grid grid-cols-3 gap-2">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={cn(
              "relative flex flex-col items-center gap-1 p-3 rounded-lg border transition-all duration-200",
              "hover:border-primary/50 hover:bg-secondary/50",
              value === mode.value
                ? "border-primary bg-primary/10 glow-primary-sm"
                : "border-border bg-secondary/30"
            )}
          >
            <span className="text-xl">{mode.icon}</span>
            <span className="text-sm font-medium text-foreground">{mode.label}</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">
              {mode.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
