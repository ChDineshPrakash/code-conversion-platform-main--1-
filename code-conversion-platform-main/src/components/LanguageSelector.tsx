import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languages = [
  { value: "python", label: "Python", icon: "🐍" },
  { value: "javascript", label: "JavaScript", icon: "⚡" },
  { value: "typescript", label: "TypeScript", icon: "💙" },
  { value: "java", label: "Java", icon: "☕" },
  { value: "csharp", label: "C#", icon: "💜" },
  { value: "cpp", label: "C++", icon: "⚙️" },
  { value: "c", label: "C", icon: "🔧" },
  { value: "rust", label: "Rust", icon: "🦀" },
  { value: "go", label: "Go", icon: "🐹" },
  { value: "kotlin", label: "Kotlin", icon: "🎯" },
  { value: "swift", label: "Swift", icon: "🍎" },
  { value: "php", label: "PHP", icon: "🐘" },
  { value: "ruby", label: "Ruby", icon: "💎" },
  { value: "scala", label: "Scala", icon: "🔴" },
  { value: "bash", label: "Bash", icon: "🖥️" },
];

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function LanguageSelector({ value, onChange, label }: LanguageSelectorProps) {
  const selectedLang = languages.find((l) => l.value === value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-secondary border-border hover:border-primary/50 transition-colors">
          <SelectValue>
            {selectedLang && (
              <span className="flex items-center gap-2">
                <span>{selectedLang.icon}</span>
                <span>{selectedLang.label}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {languages.map((lang) => (
            <SelectItem
              key={lang.value}
              value={lang.value}
              className="hover:bg-secondary focus:bg-secondary cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span>{lang.icon}</span>
                <span>{lang.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
