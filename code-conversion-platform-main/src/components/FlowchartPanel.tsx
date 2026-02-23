import { useEffect, useRef, useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp, GitBranch, Loader2 } from "lucide-react";
import { generateFlowchart } from "@/lib/flowchartGenerator";
import { toast } from "sonner";

interface FlowchartPanelProps {
    code: string;
    language: string;
}

export function FlowchartPanel({ code, language }: FlowchartPanelProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgContent, setSvgContent] = useState<string>("");
    const [mermaidDef, setMermaidDef] = useState<string>("");
    const [showRaw, setShowRaw] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [nodeCount, setNodeCount] = useState(0);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (!code.trim()) {
            setSvgContent("");
            setMermaidDef("");
            setError("");
            return;
        }

        let cancelled = false;
        setIsRendering(true);
        setError("");

        const run = async () => {
            try {
                // Generate flowchart definition
                const result = generateFlowchart(code, language);
                if (cancelled) return;

                setMermaidDef(result.definition);
                setNodeCount(result.nodeCount);

                // Dynamically import mermaid to avoid SSR issues
                const mermaid = (await import("mermaid")).default;
                mermaid.initialize({
                    startOnLoad: false,
                    theme: "dark",
                    flowchart: { curve: "basis", padding: 20 },
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

                const uniqueId = `mermaid-${Date.now()}`;
                const { svg } = await mermaid.render(uniqueId, result.definition);
                if (cancelled) return;
                setSvgContent(svg);
            } catch (err) {
                if (cancelled) return;
                console.error("Mermaid render error:", err);
                setError("Could not render flowchart. The code may be too complex or use unsupported syntax.");
            } finally {
                if (!cancelled) setIsRendering(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [code, language]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(mermaidDef);
        setCopied(true);
        toast.success("Mermaid code copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Empty state ──
    if (!code.trim()) {
        return (
            <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed border-border bg-secondary/10 text-muted-foreground gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <GitBranch className="w-6 h-6 text-primary/60" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium">No code to visualize</p>
                    <p className="text-xs mt-1 opacity-70">Paste some code in the editor above, then click Generate Flowchart</p>
                </div>
            </div>
        );
    }

    // ── Loading state ──
    if (isRendering) {
        return (
            <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-border bg-secondary/10 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Analyzing code structure...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Stats bar */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        {nodeCount} nodes
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm bg-cyan-600" />
                        Decisions
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-violet-600" />
                        Start / End
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        disabled={!mermaidDef}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                    >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied!" : "Copy Mermaid"}
                    </button>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 text-sm text-yellow-400">
                    ⚠️ {error}
                </div>
            )}

            {/* Rendered SVG diagram */}
            {svgContent && (
                <div
                    ref={containerRef}
                    className="rounded-xl border border-border bg-card overflow-auto p-6"
                    style={{ minHeight: "300px", maxHeight: "560px" }}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                />
            )}

            {/* Raw Mermaid code collapsible */}
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
