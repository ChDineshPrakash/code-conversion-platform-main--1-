// Offline flowchart generator — parses code structure and outputs Mermaid flowchart TD syntax
// No API or AST library required: uses indentation + regex patterns for common constructs.

export interface FlowchartResult {
  definition: string;
  nodeCount: number;
  language: string;
}

interface FlowNode {
  id: string;
  label: string;
  shape: "round" | "rect" | "diamond" | "stadium";
}

interface Edge {
  from: string;
  to: string;
  label?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let nodeCounter = 0;
function newId(prefix = "N") {
  return `${prefix}${++nodeCounter}`;
}

/** Strip characters that break Mermaid label parsing */
function sanitize(text: string): string {
  return text
    .replace(/"/g, "'")        // double quotes break Mermaid quoted labels
    .replace(/[<>{}[\]]/g, "") // bracket chars are Mermaid shape syntax
    .replace(/`/g, "")
    .trim()
    .slice(0, 55);
}

/** Emit a Mermaid node definition with quoted labels for safety */
function nodeDefinition(node: FlowNode): string {
  const lbl = node.label;
  switch (node.shape) {
    case "stadium":
      return `${node.id}(["${lbl}"])`;
    case "diamond":
      return `${node.id}{"${lbl}"}`;
    case "rect":
    default:
      return `${node.id}["${lbl}"]`;
  }
}

// ─── Language-specific patterns ────────────────────────────────────────────────

interface LangPatterns {
  funcDef: RegExp;
  ifStmt: RegExp;
  elifStmt: RegExp;
  elseStmt: RegExp;
  forStmt: RegExp;
  whileStmt: RegExp;
  blockEnd: RegExp | null;
  indentBased: boolean;
}

function getPatterns(language: string): LangPatterns {
  const py: LangPatterns = {
    funcDef: /^(\s*)def\s+(\w+)\s*\((.*?)\)\s*:/,
    ifStmt: /^(\s*)if\s+(.+?)\s*:/,
    elifStmt: /^(\s*)elif\s+(.+?)\s*:/,
    elseStmt: /^(\s*)else\s*:/,
    forStmt: /^(\s*)for\s+(.+?)\s*:/,
    whileStmt: /^(\s*)while\s+(.+?)\s*:/,
    blockEnd: null,
    indentBased: true,
  };

  const js: LangPatterns = {
    funcDef: /^(\s*)(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\())\s*\((.*?)\)/,
    ifStmt: /^(\s*)if\s*\((.+?)\)\s*\{?/,
    elifStmt: /^(\s*)}\s*else\s+if\s*\((.+?)\)\s*\{?/,
    elseStmt: /^(\s*)}\s*else\s*\{?/,
    forStmt: /^(\s*)for\s*\((.*?)\)\s*\{?/,
    whileStmt: /^(\s*)while\s*\((.+?)\)\s*\{?/,
    blockEnd: /^\s*\}\s*;?\s*$/,
    indentBased: false,
  };

  if (["javascript", "typescript"].includes(language)) return js;
  return py;
}

// ─── Main Generator ─────────────────────────────────────────────────────────

export function generateFlowchart(code: string, language: string): FlowchartResult {
  nodeCounter = 0;

  const pat = getPatterns(language);

  // Filter out blank lines and pure comment lines
  const lines = code.split("\n").filter((l) => {
    const t = l.trim();
    return t !== "" && !t.startsWith("//") && !t.startsWith("#");
  });

  const nodes: FlowNode[] = [];
  const edges: Edge[] = [];

  // Indent/block tracking
  const indentStack: number[] = [0];
  // Stack of exit-node IDs for block structures (if/for/while)
  const blockStack: { exitId: string; type: string }[] = [];

  let prevId: string | null = null;

  function link(fromId: string, toId: string, label?: string) {
    edges.push({ from: fromId, to: toId, label });
  }

  function addProcess(label: string): string {
    const id = newId("P");
    nodes.push({ id, label: sanitize(label), shape: "rect" });
    if (prevId) link(prevId, id);
    prevId = id;
    return id;
  }

  // START node
  const startId = newId("ST");
  nodes.push({ id: startId, label: "Start", shape: "stadium" });
  prevId = startId;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    const currentIndent = rawLine.search(/\S/);

    // ── Dedent (indent-based languages) ──────────────────────────────────────
    if (pat.indentBased && currentIndent < indentStack[indentStack.length - 1]) {
      while (indentStack.length > 1 && currentIndent <= indentStack[indentStack.length - 1]) {
        indentStack.pop();
        if (blockStack.length > 0) {
          const frame = blockStack[blockStack.length - 1];
          // Connect end of block body to its exit node
          if (prevId && prevId !== frame.exitId) {
            link(prevId, frame.exitId);
          }
          prevId = frame.exitId;
          blockStack.pop();
        }
      }
    }

    // ── Function definition ──────────────────────────────────────────────────
    const funcMatch = rawLine.match(pat.funcDef);
    if (funcMatch) {
      const name = funcMatch[2] || funcMatch[3] || "func";
      const params = funcMatch[4] || funcMatch[3] || "";
      const label = `Function: ${sanitize(name)}(${sanitize(params)})`;
      const id = newId("FN");
      nodes.push({ id, label, shape: "rect" });
      if (prevId) link(prevId, id);
      prevId = id;
      if (pat.indentBased) indentStack.push(currentIndent + 4);
      // Function exit — merged after body ends
      const exitId = newId("FX");
      nodes.push({ id: exitId, label: "End Function", shape: "rect" });
      blockStack.push({ exitId, type: "func" });
      continue;
    }

    // ── elif (must check before if) ──────────────────────────────────────────
    const elifMatch = rawLine.match(pat.elifStmt);
    if (elifMatch) {
      const cond = sanitize(elifMatch[2] || "elif condition");
      const id = newId("EL");
      nodes.push({ id, label: `${cond}?`, shape: "diamond" });
      if (prevId) link(prevId, id);
      prevId = id;
      if (pat.indentBased) indentStack.push(currentIndent + 4);
      continue;
    }

    // ── if statement ─────────────────────────────────────────────────────────
    const ifMatch = rawLine.match(pat.ifStmt);
    if (ifMatch && !rawLine.match(pat.elifStmt)) {
      const cond = sanitize(ifMatch[2] || "condition");
      const decId = newId("IF");
      nodes.push({ id: decId, label: `${cond}?`, shape: "diamond" });
      if (prevId) link(prevId, decId);

      // Exit/merge node (where both branches rejoin)
      const exitId = newId("JN");
      nodes.push({ id: exitId, label: "Continue", shape: "rect" });
      blockStack.push({ exitId, type: "if" });

      // No branch goes straight to exit
      link(decId, exitId, "No");

      // Yes branch — create a pass-through node so the layout is clear
      const yesId = newId("YS");
      nodes.push({ id: yesId, label: "Yes", shape: "rect" });
      link(decId, yesId, "Yes");
      prevId = yesId;
      if (pat.indentBased) indentStack.push(currentIndent + 4);
      continue;
    }

    // ── else ──────────────────────────────────────────────────────────────────
    if (rawLine.match(pat.elseStmt)) {
      // Connect current prevId (end of "yes" branch) back to join later
      if (blockStack.length > 0 && prevId) {
        const frame = blockStack[blockStack.length - 1];
        if (prevId !== frame.exitId) link(prevId, frame.exitId);
      }
      const elseId = newId("ES");
      nodes.push({ id: elseId, label: "Else", shape: "rect" });
      // Else starts fresh from the decision — we re-use the last diamond
      // Find the diamond we pushed: walk back edges
      const lastDiamond = [...nodes].reverse().find((n) => n.shape === "diamond");
      if (lastDiamond) link(lastDiamond.id, elseId, "No (else)");
      prevId = elseId;
      if (pat.indentBased) indentStack.push(currentIndent + 4);
      continue;
    }

    // ── for loop ──────────────────────────────────────────────────────────────
    const forMatch = rawLine.match(pat.forStmt);
    if (forMatch) {
      const cond = sanitize(forMatch[2] || "item in collection");
      const loopId = newId("FL");
      nodes.push({ id: loopId, label: `Loop: ${cond}`, shape: "diamond" });
      if (prevId) link(prevId, loopId);

      const exitId = newId("FD");
      nodes.push({ id: exitId, label: "Loop Done", shape: "rect" });
      link(loopId, exitId, "Done");
      blockStack.push({ exitId, type: "for" });

      prevId = loopId;
      if (pat.indentBased) indentStack.push(currentIndent + 4);
      continue;
    }

    // ── while loop ─────────────────────────────────────────────────────────────
    const whileMatch = rawLine.match(pat.whileStmt);
    if (whileMatch) {
      const cond = sanitize(whileMatch[2] || "condition");
      const wId = newId("WL");
      nodes.push({ id: wId, label: `While: ${cond}?`, shape: "diamond" });
      if (prevId) link(prevId, wId);

      const exitId = newId("WX");
      nodes.push({ id: exitId, label: "Exit Loop", shape: "rect" });
      link(wId, exitId, "False");
      blockStack.push({ exitId, type: "while" });

      prevId = wId;
      if (pat.indentBased) indentStack.push(currentIndent + 4);
      continue;
    }

    // ── return ────────────────────────────────────────────────────────────────
    const retMatch = trimmed.match(/^return\s*(.*)/);
    if (retMatch) {
      const val = sanitize(retMatch[1] || "");
      addProcess(val ? `Return: ${val}` : "Return");
      continue;
    }

    // ── print / console.log ───────────────────────────────────────────────────
    const printMatch = trimmed.match(/^(?:print|console\.(?:log|warn|error))\s*\((.*)\)/);
    if (printMatch) {
      addProcess(`Output: ${sanitize(printMatch[1])}`);
      continue;
    }

    // ── Closing brace (JS/TS) ─────────────────────────────────────────────────
    if (!pat.indentBased && pat.blockEnd && trimmed.match(pat.blockEnd)) {
      if (blockStack.length > 0) {
        const frame = blockStack.pop()!;
        if (prevId && prevId !== frame.exitId) link(prevId, frame.exitId);
        prevId = frame.exitId;
      }
      continue;
    }

    // ── Variable assignment ────────────────────────────────────────────────────
    const assignMatch = trimmed.match(/^(?:(?:const|let|var)\s+)?(\w+)\s*=\s*(.+?)(?:;)?$/);
    if (assignMatch && !/^(if|else|elif|for|while|def|function|return|print|class)$/.test(assignMatch[1])) {
      addProcess(`${sanitize(assignMatch[1])} = ${sanitize(assignMatch[2])}`);
      continue;
    }

    // ── Generic function call / statement ──────────────────────────────────────
    const callMatch = trimmed.match(/^(\w[\w.]*)\s*\(/);
    if (callMatch) {
      addProcess(`Call: ${sanitize(trimmed.slice(0, 50))}`);
      continue;
    }
  }

  // Flush remaining block stack
  while (blockStack.length > 0) {
    const frame = blockStack.pop()!;
    if (prevId && prevId !== frame.exitId) link(prevId, frame.exitId);
    prevId = frame.exitId;
  }

  // END node
  const endId = newId("END");
  nodes.push({ id: endId, label: "End", shape: "stadium" });
  if (prevId) link(prevId, endId);

  // ── Build Mermaid definition ──────────────────────────────────────────────
  const out: string[] = ["flowchart TD"];

  // Node definitions
  for (const n of nodes) {
    out.push(`  ${nodeDefinition(n)}`);
  }

  out.push("");

  // Edges — use quoted edge labels to avoid parsing issues
  for (const e of edges) {
    const arrow = e.label ? `-->|"${e.label}"|` : "-->";
    out.push(`  ${e.from} ${arrow} ${e.to}`);
  }

  // Styling — only emit class lines when nodes of that type actually exist
  out.push("");
  out.push("  classDef terminal fill:#6d28d9,stroke:#7c3aed,color:#fff");
  out.push("  classDef decision fill:#0e7490,stroke:#0891b2,color:#fff");
  out.push("  classDef process fill:#1e293b,stroke:#334155,color:#e2e8f0");

  const terminalIds = nodes.filter((n) => n.shape === "stadium").map((n) => n.id);
  const decisionIds = nodes.filter((n) => n.shape === "diamond").map((n) => n.id);
  const processIds = nodes.filter((n) => n.shape === "rect").map((n) => n.id);

  // Only emit class assignment when there are nodes — empty lists break Mermaid
  if (terminalIds.length > 0) out.push(`  class ${terminalIds.join(",")} terminal`);
  if (decisionIds.length > 0) out.push(`  class ${decisionIds.join(",")} decision`);
  if (processIds.length > 0) out.push(`  class ${processIds.join(",")} process`);

  return {
    definition: out.join("\n"),
    nodeCount: nodes.length,
    language,
  };
}
