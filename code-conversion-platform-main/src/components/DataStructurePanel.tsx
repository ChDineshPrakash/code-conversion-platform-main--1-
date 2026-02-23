import { useEffect, useState } from "react";
import {
    Copy, Check, ChevronDown, ChevronUp,
    Network, Loader2, Info
} from "lucide-react";
import { analyzeDataStructure, DSType } from "@/lib/dataStructureAnalyzer";
import { toast } from "sonner";

interface DataStructurePanelProps {
    code: string;
    language: string;
}

const DS_ICONS: Record<DSType, string> = {
    "linked-list": "🔗",
    stack: "📚",
    queue: "🚶",
    "binary-tree": "🌳",
    generic: "📦",
};

const CONFIDENCE_COLORS: Record<string, string> = {
    high: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    low: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export function DataStructurePanel({ code, language }: DataStructurePanelProps) {
    const [svgContent, setSvgContent] = useState("");
    const [mermaidDef, setMermaidDef] = useState("");
    const [typeName, setTypeName] = useState("");
    const [dsType, setDsType] = useState<DSType>("generic");
    const [confidence, setConfidence] = useState<"high" | "medium" | "low">("low");
    const [explanation, setExplanation] = useState("");
    const [detectedValues, setDetVals] = useState<(string | number)[]>([]);
    const [showRaw, setShowRaw] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!code.trim()) {
            setSvgContent(""); setMermaidDef(""); setError("");
            return;
        }

        let cancelled = false;
        setIsAnalyzing(true);
        setError("");

        const run = async () => {
            try {
                const result = analyzeDataStructure(code, language);
                if (cancelled) return;

                setTypeName(result.typeName);
                setDsType(result.type);
                setConfidence(result.confidence);
                setExplanation(result.explanation);
                setDetVals(result.values);
                setMermaidDef(result.mermaidDefinition);

                const mermaid = (await import("mermaid")).default;
                mermaid.initialize({
                    startOnLoad: false,
                    theme: "dark",
                    flowchart: { curve: "basis", padding: 24 },
                    themeVariables: {
                        primaryColor: "#6d28d9",
                        primaryBorderColor: "#7c3aed",
                        primaryTextColor: "#e2e8f0",
                        lineColor: "#64748b",
                        background: "#0f172a",
                        mainBkg: "#1e293b",
                        nodeBorder: "#334155",
                        edgeLabelBackground: "#1e293b",
                    },
                });

                const uid = `ds-${Date.now()}`;
                const { svg } = await mermaid.render(uid, result.mermaidDefinition);
                if (cancelled) return;
                setSvgContent(svg);
            } catch (err) {
                if (cancelled) return;
                console.error("DS render error:", err);
                setError("Could not render the diagram. Try simplifying the code snippet.");
            } finally {
                if (!cancelled) setIsAnalyzing(false);
            }
        };

        run();
        return () => { cancelled = true; };
    }, [code, language]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(mermaidDef);
        setCopied(true);
        toast.success("Mermaid code copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Empty state ──────────────────────────────────────────────────────────────
    if (!code.trim()) {
        return (
            <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed border-border bg-secondary/10 text-muted-foreground gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Network className="w-6 h-6 text-primary/60" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium">No code to analyze</p>
                    <p className="text-xs mt-1 opacity-70">Paste code containing a data structure, then click Analyze</p>
                </div>
            </div>
        );
    }

    // ── Loading ──────────────────────────────────────────────────────────────────
    if (isAnalyzing) {
        return (
            <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-border bg-secondary/10 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Analyzing data structure...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">

            {/* Detection Badge Row */}
            {typeName && (
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{DS_ICONS[dsType]}</span>
                        <span className="text-sm font-semibold text-foreground">{typeName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CONFIDENCE_COLORS[confidence]}`}>
                            {confidence} confidence
                        </span>
                    </div>
                    <button
                        onClick={handleCopy}
                        disabled={!mermaidDef}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                    >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied!" : "Copy Mermaid"}
                    </button>
                </div>
            )}

            {/* Explanation Card */}
            {explanation && (
                <div className="flex gap-2.5 p-3 rounded-lg border border-border bg-card text-xs text-muted-foreground">
                    <Info className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <p>{explanation}</p>
                </div>
            )}

            {/* Extracted values */}
            {detectedValues.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Detected values:</span>
                    {detectedValues.map((v, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-mono border border-primary/20">
                            {v}
                        </span>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 text-sm text-yellow-400">
                    ⚠️ {error}
                </div>
            )}

            {/* Rendered SVG */}
            {svgContent && (
                <div
                    className="rounded-xl border border-border bg-card overflow-auto p-6"
                    style={{ minHeight: "280px", maxHeight: "520px" }}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                />
            )}

            {/* Raw Mermaid collapsible */}
            {mermaidDef && (
                <div className="rounded-lg border border-border overflow-hidden">
                    <button
                        onClick={() => setShowRaw(!showRaw)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:bg-secondary/40 transition-colors"
                    >
                        <span className="font-medium">Raw Mermaid Definition</span>
                        {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {showRaw && (
                        <pre className="px-4 py-3 text-xs text-emerald-400 bg-black/40 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap">
                            {mermaidDef}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
}
