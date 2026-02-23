// Offline data structure analyzer
// Detects Linked List, Stack, Queue, or Binary Tree from code
// and generates an appropriate Mermaid.js diagram definition.

export type DSType = "linked-list" | "stack" | "queue" | "binary-tree" | "generic";

export interface DSAnalysisResult {
    type: DSType;
    typeName: string;
    confidence: "high" | "medium" | "low";
    mermaidDefinition: string;
    explanation: string;
    values: (string | number)[];
}

// ─── Keyword Scoring ──────────────────────────────────────────────────────────

const SIGNALS: Record<DSType, string[]> = {
    "linked-list": [
        "listnode", "linkedlist", "linked_list", ".next", "->next",
        "head", "tail", "node", "next =", "next=", "singly", "doubly",
    ],
    stack: [
        "stack", "push(", ".push", "pop(", ".pop", "peek(", ".peek",
        "lifo", "top", "isempty", "stack.append", "stack.pop",
    ],
    queue: [
        "queue", "enqueue", "dequeue", "fifo", "front", "rear",
        "popleft", "appendleft", "collections.deque", "queue.append",
    ],
    "binary-tree": [
        "treenode", "binarytree", "binary_tree", ".left", ".right",
        "->left", "->right", "root", "bst", "inorder", "preorder",
        "postorder", "insert(", "leftchild", "rightchild",
    ],
    generic: [],
};

function scoreCode(code: string): Record<DSType, number> {
    const lc = code.toLowerCase();
    const scores: Record<DSType, number> = {
        "linked-list": 0,
        stack: 0,
        queue: 0,
        "binary-tree": 0,
        generic: 0,
    };
    for (const [type, signals] of Object.entries(SIGNALS) as [DSType, string[]][]) {
        for (const signal of signals) {
            if (lc.includes(signal)) scores[type]++;
        }
    }
    return scores;
}

function pickType(scores: Record<DSType, number>): { type: DSType; confidence: "high" | "medium" | "low" } {
    const sorted = (Object.entries(scores) as [DSType, number][])
        .sort((a, b) => b[1] - a[1]);
    const [best, second] = sorted;
    if (best[0] === "generic" || best[1] === 0) return { type: "generic", confidence: "low" };
    const confidence = best[1] >= 4 ? "high" : best[1] >= 2 ? "medium" : "low";
    const _ = second; // suppress unused warning
    return { type: best[0], confidence };
}

// ─── Value Extraction ─────────────────────────────────────────────────────────

function extractValues(code: string): (string | number)[] {
    const vals = new Set<string | number>();

    // Integer literals in push/insert/append/enqueue calls
    const callRe = /(?:push|insert|append|enqueue|add)\s*\(\s*(\d+(?:\.\d+)?|['"][^'"]{1,10}['"])\s*\)/gi;
    let m: RegExpExecArray | null;
    while ((m = callRe.exec(code)) !== null) {
        const v = m[1].replace(/['"]/g, "");
        vals.add(isNaN(Number(v)) ? v : Number(v));
    }

    // Assignments like node.data = 5, node.val = "A"
    const assignRe = /\.(?:data|val|value)\s*=\s*(\d+(?:\.\d+)?|['"][^'"]{1,10}['"])/gi;
    while ((m = assignRe.exec(code)) !== null) {
        const v = m[1].replace(/['"]/g, "");
        vals.add(isNaN(Number(v)) ? v : Number(v));
    }

    // ListNode / TreeNode constructors: ListNode(5) etc.
    const ctorRe = /(?:ListNode|Node|TreeNode)\s*\(\s*(\d+(?:\.\d+)?|['"][^'"]{1,10}['"])\s*\)/gi;
    while ((m = ctorRe.exec(code)) !== null) {
        const v = m[1].replace(/['"]/g, "");
        vals.add(isNaN(Number(v)) ? v : Number(v));
    }

    const arr = Array.from(vals).slice(0, 8); // cap at 8 values
    return arr.length > 0 ? arr : [1, 2, 3, 4]; // useful default
}

// ─── Diagram Generators ───────────────────────────────────────────────────────

function linkedListDiagram(values: (string | number)[]): string {
    const lines = ["flowchart LR"];
    const ids: string[] = [];

    for (let i = 0; i < values.length; i++) {
        const id = `N${i}`;
        ids.push(id);
        lines.push(`  ${id}["data: ${values[i]}\\nnext: →"]`);
    }

    // NULL terminal
    lines.push(`  NUL(["NULL"])`)

    // HEAD marker
    lines.push(`  HEAD(["HEAD"]):::head`);
    lines.push(`  HEAD --> ${ids[0]}`);

    // Chain nodes
    for (let i = 0; i < ids.length - 1; i++) {
        lines.push(`  ${ids[i]} --> ${ids[i + 1]}`);
    }
    lines.push(`  ${ids[ids.length - 1]} --> NUL`);

    lines.push("");
    lines.push("  classDef head fill:#6d28d9,stroke:#7c3aed,color:#fff");
    lines.push("  classDef null fill:#374151,stroke:#6b7280,color:#9ca3af");
    lines.push("  classDef node fill:#1e293b,stroke:#0e7490,color:#e2e8f0");
    lines.push(`  class NUL null`);
    lines.push(`  class HEAD head`);
    if (ids.length > 0) lines.push(`  class ${ids.join(",")} node`);

    return lines.join("\n");
}

function stackDiagram(values: (string | number)[]): string {
    const lines = ["flowchart TD"];
    const reversed = [...values].reverse(); // top of stack is first

    lines.push(`  TOP(["⬆ TOP"]):::marker`);

    const ids: string[] = [];
    for (let i = 0; i < reversed.length; i++) {
        const id = `S${i}`;
        ids.push(id);
        lines.push(`  ${id}["${reversed[i]}"]`);
    }

    lines.push(`  BOT(["⬇ BOTTOM"]):::marker`);

    // Connect top marker → stack items → bottom marker
    lines.push(`  TOP --> ${ids[0]}`);
    for (let i = 0; i < ids.length - 1; i++) {
        lines.push(`  ${ids[i]} --> ${ids[i + 1]}`);
    }
    lines.push(`  ${ids[ids.length - 1]} --> BOT`);

    lines.push("");
    lines.push("  classDef marker fill:#6d28d9,stroke:#7c3aed,color:#fff");
    lines.push("  classDef item fill:#1e293b,stroke:#0e7490,color:#e2e8f0");
    if (ids.length > 0) lines.push(`  class ${ids.join(",")} item`);

    return lines.join("\n");
}

function queueDiagram(values: (string | number)[]): string {
    const lines = ["flowchart LR"];

    lines.push(`  FR(["FRONT ➜"]):::marker`);

    const ids: string[] = [];
    for (let i = 0; i < values.length; i++) {
        const id = `Q${i}`;
        ids.push(id);
        lines.push(`  ${id}["${values[i]}"]`);
    }

    lines.push(`  RE(["➜ REAR"]):::marker`);

    // FRONT → items → REAR
    lines.push(`  FR --> ${ids[0]}`);
    for (let i = 0; i < ids.length - 1; i++) {
        lines.push(`  ${ids[i]} --> ${ids[i + 1]}`);
    }
    lines.push(`  ${ids[ids.length - 1]} --> RE`);

    lines.push(`  ENQ(["enqueue →"]):::op`);
    lines.push(`  DEQ(["← dequeue"]):::op`);
    lines.push(`  RE -..->|"add here"| ENQ`);
    lines.push(`  DEQ -..->|"remove"| FR`);

    lines.push("");
    lines.push("  classDef marker fill:#6d28d9,stroke:#7c3aed,color:#fff");
    lines.push("  classDef item fill:#1e293b,stroke:#0e7490,color:#e2e8f0");
    lines.push("  classDef op fill:#0e7490,stroke:#0891b2,color:#fff");
    if (ids.length > 0) lines.push(`  class ${ids.join(",")} item`);

    return lines.join("\n");
}

function binaryTreeDiagram(values: (string | number)[]): string {
    const lines = ["flowchart TD"];

    // Build a simple BST from given values
    interface TNode { val: string | number; left: number | null; right: number | null }
    const nodes: TNode[] = [];

    function insert(val: string | number, idx: number): void {
        if (idx >= nodes.length) {
            // fill gaps
            while (nodes.length <= idx) nodes.push({ val: "?", left: null, right: null });
            nodes[idx] = { val, left: null, right: null };
        }
        const node = nodes[idx];
        if (Number(val) < Number(node.val)) {
            const lIdx = 2 * idx + 1;
            if (node.left === null) {
                while (nodes.length <= lIdx) nodes.push({ val: "?", left: null, right: null });
                nodes[lIdx] = { val, left: null, right: null };
                node.left = lIdx;
            } else {
                insert(val, node.left);
            }
        } else {
            const rIdx = 2 * idx + 2;
            if (node.right === null) {
                while (nodes.length <= rIdx) nodes.push({ val: "?", left: null, right: null });
                nodes[rIdx] = { val, left: null, right: null };
                node.right = rIdx;
            } else {
                insert(val, node.right);
            }
        }
    }

    if (values.length > 0) {
        nodes.push({ val: values[0], left: null, right: null });
        for (let i = 1; i < values.length; i++) insert(values[i], 0);
    }

    // ROOT marker
    lines.push(`  ROOT(["ROOT"]):::marker`);
    const nodeIds: string[] = [];

    for (let i = 0; i < nodes.length; i++) {
        const id = `T${i}`;
        nodeIds.push(id);
        lines.push(`  ${id}["${nodes[i].val}"]`);
    }

    // ROOT → first node
    if (nodes.length > 0) lines.push(`  ROOT --> T0`);

    // Edges
    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.left !== null && n.left < nodes.length) {
            lines.push(`  T${i} -->|"left"| T${n.left}`);
        }
        if (n.right !== null && n.right < nodes.length) {
            lines.push(`  T${i} -->|"right"| T${n.right}`);
        }
    }

    lines.push("");
    lines.push("  classDef marker fill:#6d28d9,stroke:#7c3aed,color:#fff");
    lines.push("  classDef tnode fill:#1e293b,stroke:#0e7490,color:#e2e8f0");
    if (nodeIds.length > 0) lines.push(`  class ${nodeIds.join(",")} tnode`);

    return lines.join("\n");
}

function genericDiagram(values: (string | number)[]): string {
    const lines = ["flowchart LR"];
    const ids: string[] = [];
    for (let i = 0; i < values.length; i++) {
        const id = `G${i}`;
        ids.push(id);
        lines.push(`  ${id}["[${i}]: ${values[i]}"]`);
        if (i > 0) lines.push(`  G${i - 1} --> ${id}`);
    }
    lines.push("");
    lines.push("  classDef item fill:#1e293b,stroke:#0e7490,color:#e2e8f0");
    if (ids.length > 0) lines.push(`  class ${ids.join(",")} item`);
    return lines.join("\n");
}

// ─── Explanations ─────────────────────────────────────────────────────────────

const EXPLANATIONS: Record<DSType, string> = {
    "linked-list":
        "A Linked List is a linear structure where each node holds data and a pointer (next) to the next node. Traversal is sequential from HEAD to NULL.",
    stack:
        "A Stack is a LIFO (Last-In, First-Out) structure. Elements are pushed onto the TOP and popped from the TOP. Think of a stack of plates.",
    queue:
        "A Queue is a FIFO (First-In, First-Out) structure. Elements are enqueued at the REAR and dequeued from the FRONT. Think of a waiting line.",
    "binary-tree":
        "A Binary Tree is a hierarchical structure where each node has at most two children: left and right. A BST keeps left < root < right for fast searching.",
    generic:
        "A generic array or collection was detected. Elements are shown in index order with sequential links.",
};

// ─── Public API ───────────────────────────────────────────────────────────────

export function analyzeDataStructure(code: string, language: string): DSAnalysisResult {
    const _ = language; // language hint available for future extension
    const scores = scoreCode(code);
    const { type, confidence } = pickType(scores);
    const values = extractValues(code);

    const typeNames: Record<DSType, string> = {
        "linked-list": "Linked List",
        stack: "Stack",
        queue: "Queue",
        "binary-tree": "Binary Tree",
        generic: "Array / Collection",
    };

    let mermaidDefinition: string;
    switch (type) {
        case "linked-list": mermaidDefinition = linkedListDiagram(values); break;
        case "stack": mermaidDefinition = stackDiagram(values); break;
        case "queue": mermaidDefinition = queueDiagram(values); break;
        case "binary-tree": mermaidDefinition = binaryTreeDiagram(values); break;
        default: mermaidDefinition = genericDiagram(values); break;
    }

    return {
        type,
        typeName: typeNames[type],
        confidence,
        mermaidDefinition,
        explanation: EXPLANATIONS[type],
        values,
    };
}
