import { useState } from "react";
import { Copy, Check, Trash2, ArrowRightLeft, Info, GitBranch, Code2, Network, Play, TerminalSquare } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ConversionModeSelector } from "@/components/ConversionModeSelector";
import { CodeEditor } from "@/components/CodeEditor";
import { ConvertButton } from "@/components/ConvertButton";
import { FlowchartPanel } from "@/components/FlowchartPanel";
import { DataStructurePanel } from "@/components/DataStructurePanel";

import { convertCode } from "@/lib/codeConverter";
import { toast } from "sonner";

const sampleCode = `def greet(name):
    print(f"Hello, {name}!")
    return True

for i in range(5):
    if i % 2 == 0:
        print(f"{i} is even")
    else:
        print(f"{i} is odd")

greet("World")`;

type Tab = "conversion" | "flowchart" | "dsvisualizer";

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("conversion");
  const [sourceLanguage, setSourceLanguage] = useState("python");
  const [targetLanguage, setTargetLanguage] = useState("javascript");
  const [conversionMode, setConversionMode] = useState("idiomatic");
  const [sourceCode, setSourceCode] = useState(sampleCode);
  const [convertedCode, setConvertedCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Flowchart state
  const [flowchartCode, setFlowchartCode] = useState(sampleCode);
  const [flowchartLanguage, setFlowchartLanguage] = useState("python");
  const [generatedFlowchart, setGeneratedFlowchart] = useState(false);
  const [pendingFlowchartCode, setPendingFlowchartCode] = useState(sampleCode);
  const [pendingFlowchartLang, setPendingFlowchartLang] = useState("python");

  // DS Visualizer state
  const [dsCode, setDsCode] = useState("");
  const [dsLanguage, setDsLanguage] = useState("python");
  const [analyzedDsCode, setAnalyzedDsCode] = useState("");
  const [analyzedDsLang, setAnalyzedDsLang] = useState("python");

  // Run output state (Code Conversion tab)
  const [sourceRunOutput, setSourceRunOutput] = useState<string | null>(null);
  const [sourceRunStatus, setSourceRunStatus] = useState<"success" | "error" | null>(null);
  const [convertedRunOutput, setConvertedRunOutput] = useState<string | null>(null);
  const [convertedRunStatus, setConvertedRunStatus] = useState<"success" | "error" | null>(null);

  // Inline execution helper
  const simpleRunCode = (code: string): { output: string; status: "success" | "error" } => {
    const lines = code.split("\n");
    const scope = new Map<string, unknown>();
    const out: string[] = [];
    let status: "success" | "error" = "success";

    const safeEval = (expr: string): unknown => {
      const e = expr.trim();
      if (/^(['"\`]).*\1$/.test(e)) {
        return e.slice(1, -1).replace(/\{(\w+)\}|\$\{(\w+)\}/g, (_: string, a: string, b: string) =>
          String(scope.get(a ?? b) ?? (a ?? b)));
      }
      if (e === "True" || e === "true") return true;
      if (e === "False" || e === "false") return false;
      if (e === "None" || e === "null") return null;
      if (/^-?\d+(\.\d+)?$/.test(e)) return Number(e);
      if (/^\w+$/.test(e)) {
        if (!scope.has(e)) throw new ReferenceError(`NameError: '${e}' is not defined`);
        return scope.get(e);
      }
      // division by zero check
      const divMatch = e.match(/^(.+?)\s*\/\s*(.+)$/);
      if (divMatch) {
        const rhs = Number(safeEval(divMatch[2]));
        if (rhs === 0) throw new Error("ZeroDivisionError: division by zero");
        return Number(safeEval(divMatch[1])) / rhs;
      }
      // Simple arithmetic via regex
      const arithMatch = e.match(/^(.+?)\s*([+\-*%])\s*(.+)$/);
      if (arithMatch) {
        const l = safeEval(arithMatch[1]);
        const r = safeEval(arithMatch[3]);
        if (arithMatch[2] === "+" && (typeof l === "string" || typeof r === "string")) return String(l) + String(r);
        const ops: Record<string, (a: number, b: number) => number> = {
          "+": (a, b) => a + b, "-": (a, b) => a - b, "*": (a, b) => a * b, "%": (a, b) => a % b
        };
        return ops[arithMatch[2]](Number(l), Number(r));
      }
      return e;
    };

    try {
      for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const t = raw.trim();
        if (!t || t.startsWith("#") || t.startsWith("//")) continue;

        // print / console.log
        const printM = t.match(/^(?:print|console\.(?:log|warn|error))\s*\((.*)\)\s*;?$/);
        if (printM) { out.push(String(safeEval(printM[1]) ?? "None")); continue; }

        // JS var declaration
        const jsM = t.match(/^(?:const|let|var)\s+(\w+)\s*=\s*(.+?)\s*;?$/);
        if (jsM) { scope.set(jsM[1], safeEval(jsM[2])); continue; }

        // py/js assignment
        const aM = t.match(/^(\w+)\s*=\s*(.+?)\s*;?$/);
        if (aM && !["if", "for", "while", "def", "class", "return"].includes(aM[1])) {
          scope.set(aM[1], safeEval(aM[2])); continue;
        }
      }
    } catch (err) {
      out.push(String(err).replace(/^Error:\s*/, ""));
      status = "error";
    }

    return { output: out.join("\n") || (status === "success" ? "(no output)" : ""), status };
  };

  const handleRunSource = () => {
    if (!sourceCode.trim()) return;
    const { output, status } = simpleRunCode(sourceCode);
    setSourceRunOutput(output);
    setSourceRunStatus(status);
  };

  const handleRunConverted = () => {
    if (!convertedCode.trim()) return;
    const { output, status } = simpleRunCode(convertedCode);
    setConvertedRunOutput(output);
    setConvertedRunStatus(status);
  };

  const handleConvert = async () => {
    if (!sourceCode.trim()) {
      toast.error("Please enter some code to convert");
      return;
    }
    setIsConverting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const result = convertCode(sourceCode, sourceLanguage, targetLanguage, conversionMode);
    setConvertedCode(result.code);
    setExplanation(result.explanation);
    setWarnings(result.warnings);
    setIsConverting(false);
    toast.success("Code converted successfully!");
  };

  const handleSwapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    if (convertedCode) {
      setSourceCode(convertedCode);
      setConvertedCode("");
      setExplanation("");
      setWarnings([]);
    }
  };

  const handleCopy = async () => {
    if (!convertedCode) return;
    await navigator.clipboard.writeText(convertedCode);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setSourceCode("");
    setConvertedCode("");
    setExplanation("");
    setWarnings([]);
  };

  const handleGenerateFlowchart = () => {
    if (!pendingFlowchartCode.trim()) {
      toast.error("Please enter some code to visualize");
      return;
    }
    setFlowchartCode(pendingFlowchartCode);
    setFlowchartLanguage(pendingFlowchartLang);
    setGeneratedFlowchart(true);
    toast.success("Flowchart generated!");
  };

  const handleAnalyzeDS = () => {
    if (!dsCode.trim()) {
      toast.error("Please enter some code to analyze");
      return;
    }
    setAnalyzedDsCode(dsCode);
    setAnalyzedDsLang(dsLanguage);
    toast.success("Data structure analyzed!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border header-gradient">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-primary-sm">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Code<span className="text-primary">Polyglot</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Offline Code Translation Engine
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg border border-border">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Offline Mode Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="border-b border-border bg-background/80 sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 pt-2">
            <button
              onClick={() => setActiveTab("conversion")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${activeTab === "conversion"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                }`}
            >
              <Code2 className="w-4 h-4" />
              Code Conversion
            </button>
            <button
              onClick={() => setActiveTab("flowchart")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${activeTab === "flowchart"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                }`}
            >
              <GitBranch className="w-4 h-4" />
              Flowchart
            </button>
            <button
              onClick={() => setActiveTab("dsvisualizer")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${activeTab === "dsvisualizer"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                }`}
            >
              <Network className="w-4 h-4" />
              DS Visualizer
            </button>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">

        {/* ── CODE CONVERSION TAB ── */}
        {activeTab === "conversion" && (
          <div>
            {/* Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <LanguageSelector
                  value={sourceLanguage}
                  onChange={setSourceLanguage}
                  label="Source Language"
                />
                <div className="flex justify-center">
                  <button
                    onClick={handleSwapLanguages}
                    className="p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary hover:border-primary/50 transition-all"
                    title="Swap languages"
                  >
                    <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <LanguageSelector
                  value={targetLanguage}
                  onChange={setTargetLanguage}
                  label="Target Language"
                />
              </div>
              <ConversionModeSelector
                value={conversionMode}
                onChange={setConversionMode}
              />
            </div>

            {/* Code Editors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Source Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Source Code
                  </h2>
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                </div>
                <div className="h-[400px] animate-fade-in">
                  <CodeEditor
                    value={sourceCode}
                    onChange={setSourceCode}
                    language={sourceLanguage}
                    placeholder="Paste your source code here..."
                  />
                </div>
                {/* Source Run Button + Output */}
                <div className="space-y-2">
                  <button
                    onClick={handleRunSource}
                    disabled={!sourceCode.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                      bg-emerald-600/90 text-white hover:bg-emerald-500 disabled:opacity-40
                      disabled:cursor-not-allowed transition-all border border-emerald-500/30"
                  >
                    <Play className="w-3 h-3" />
                    Run Source
                  </button>
                  {sourceRunOutput !== null && (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 border-b border-border">
                        <TerminalSquare className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-mono">output</span>
                        <span className={`ml-auto text-xs font-semibold ${sourceRunStatus === "error" ? "text-red-400" : "text-emerald-400"
                          }`}>{sourceRunStatus === "error" ? "Error" : "OK"}</span>
                      </div>
                      <pre className={`px-3 py-2 text-xs font-mono bg-black/70 leading-relaxed whitespace-pre-wrap break-all ${sourceRunStatus === "error" ? "text-red-400" : "text-emerald-300"
                        }`}>{sourceRunOutput}</pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Target Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Converted Code
                  </h2>
                  <button
                    onClick={handleCopy}
                    disabled={!convertedCode}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="h-[400px] animate-fade-in">
                  <CodeEditor
                    value={convertedCode}
                    language={targetLanguage}
                    readOnly
                    placeholder="Converted code will appear here..."
                  />
                </div>
                {/* Converted Run Button + Output */}
                <div className="space-y-2">
                  <button
                    onClick={handleRunConverted}
                    disabled={!convertedCode.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                      bg-emerald-600/90 text-white hover:bg-emerald-500 disabled:opacity-40
                      disabled:cursor-not-allowed transition-all border border-emerald-500/30"
                  >
                    <Play className="w-3 h-3" />
                    Run Converted
                  </button>
                  {convertedRunOutput !== null && (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 border-b border-border">
                        <TerminalSquare className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-mono">output</span>
                        <span className={`ml-auto text-xs font-semibold ${convertedRunStatus === "error" ? "text-red-400" : "text-emerald-400"
                          }`}>{convertedRunStatus === "error" ? "Error" : "OK"}</span>
                      </div>
                      <pre className={`px-3 py-2 text-xs font-mono bg-black/70 leading-relaxed whitespace-pre-wrap break-all ${convertedRunStatus === "error" ? "text-red-400" : "text-emerald-300"
                        }`}>{convertedRunOutput}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="max-w-md mx-auto mb-8">
              <ConvertButton
                onClick={handleConvert}
                isLoading={isConverting}
                disabled={!sourceCode.trim()}
              />
            </div>

            {/* Explanation & Warnings */}
            {(explanation || warnings.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                {explanation && (
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-primary" />
                      <h3 className="font-medium text-foreground">Explanation</h3>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {explanation}
                    </p>
                  </div>
                )}
                {warnings.length > 0 && (
                  <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-yellow-500">⚠️</span>
                      <h3 className="font-medium text-yellow-500">Warnings</h3>
                    </div>
                    <ul className="space-y-1">
                      {warnings.map((warning, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )
        }

        {/* ── FLOWCHART TAB ── */}
        {
          activeTab === "flowchart" && (
            <div className="space-y-6">
              {/* Description */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex gap-3">
                <GitBranch className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Logic Flowchart Generator</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Paste code below and click <strong>Generate Flowchart</strong> to visualize the execution flow — including
                    Start/End nodes, Decision diamonds (if/for/while), and Process blocks (assignments, output).
                  </p>
                </div>
              </div>

              {/* Language selector + Editor */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Source Code
                    </h2>
                    <LanguageSelector
                      value={pendingFlowchartLang}
                      onChange={setPendingFlowchartLang}
                      label=""
                    />
                  </div>
                  <div className="h-[380px]">
                    <CodeEditor
                      value={pendingFlowchartCode}
                      onChange={setPendingFlowchartCode}
                      language={pendingFlowchartLang}
                      placeholder="Paste your code here to generate a flowchart..."
                    />
                  </div>
                </div>

                {/* Flowchart output */}
                <div className="space-y-3">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Flowchart Diagram
                  </h2>
                  <FlowchartPanel
                    code={generatedFlowchart ? flowchartCode : ""}
                    language={flowchartLanguage}
                  />
                </div>
              </div>

              {/* Generate button */}
              <div className="max-w-md mx-auto">
                <button
                  onClick={handleGenerateFlowchart}
                  disabled={!pendingFlowchartCode.trim()}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm
                  bg-primary text-primary-foreground hover:bg-primary/90
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5
                  active:translate-y-0"
                >
                  <GitBranch className="w-4 h-4" />
                  Generate Flowchart
                </button>
              </div>
            </div>
          )
        }

        {/* ── DS VISUALIZER TAB ── */}
        {
          activeTab === "dsvisualizer" && (
            <div className="space-y-6">
              {/* Description banner */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex gap-3">
                <Network className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Data Structure Visualizer</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Paste code that uses a <strong>Linked List</strong>, <strong>Stack</strong>, <strong>Queue</strong>, or <strong>Binary Tree</strong>.
                    The analyzer detects the structure and renders a labelled Mermaid diagram showing nodes, pointers, and markers.
                  </p>
                </div>
              </div>

              {/* Editor + Output */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left — editor */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Source Code
                    </h2>
                    <LanguageSelector
                      value={dsLanguage}
                      onChange={setDsLanguage}
                      label=""
                    />
                  </div>
                  <div className="h-[380px]">
                    <CodeEditor
                      value={dsCode}
                      onChange={setDsCode}
                      language={dsLanguage}
                      placeholder={`Paste code here, e.g.\n\nclass ListNode:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\nhead = ListNode(1)\nhead.next = ListNode(2)\nhead.next.next = ListNode(3)`}
                    />
                  </div>
                </div>

                {/* Right — visualization */}
                <div className="space-y-3">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Structure Diagram
                  </h2>
                  <DataStructurePanel
                    code={analyzedDsCode}
                    language={analyzedDsLang}
                  />
                </div>
              </div>

              {/* Analyze button */}
              <div className="max-w-md mx-auto">
                <button
                  onClick={handleAnalyzeDS}
                  disabled={!dsCode.trim()}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm
                  bg-primary text-primary-foreground hover:bg-primary/90
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5
                  active:translate-y-0"
                >
                  <Network className="w-4 h-4" />
                  Analyze &amp; Visualize
                </button>
              </div>
            </div>
          )
        }
      </main >

      {/* Footer */}
      < footer className="border-t border-border mt-auto" >
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-xs text-muted-foreground">
            🔒 100% Offline • No API Keys Required • AST-Based Translation
          </p>
        </div>
      </footer >
    </div >
  );
}
