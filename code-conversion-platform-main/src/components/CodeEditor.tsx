import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  language: string;
  placeholder?: string;
}

export function CodeEditor({
  value,
  onChange,
  readOnly = false,
  language,
  placeholder = "Paste your code here...",
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = value.split("\n");
  const lineCount = Math.max(lines.length, 1);

  useEffect(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, [value]);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div className="relative h-full rounded-lg overflow-hidden border border-code-border code-editor-bg">
      {/* Language badge */}
      <div className="absolute top-3 right-3 z-10">
        <span className="px-2 py-1 text-xs font-mono font-medium text-primary bg-primary/10 rounded border border-primary/20">
          {language.toUpperCase()}
        </span>
      </div>

      <div className="flex h-full">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 w-12 pt-4 pr-2 text-right select-none overflow-hidden bg-code-bg/50"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i + 1}
              className="font-mono text-xs text-code-lineNumber leading-6 h-6"
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onScroll={handleScroll}
            readOnly={readOnly}
            placeholder={placeholder}
            spellCheck={false}
            className={cn(
              "w-full h-full p-4 pl-2 resize-none font-mono text-sm leading-6",
              "bg-transparent text-foreground placeholder:text-muted-foreground/50",
              "focus:outline-none focus:ring-0 border-0",
              readOnly && "cursor-default"
            )}
            style={{ tabSize: 2 }}
          />
        </div>
      </div>
    </div>
  );
}
