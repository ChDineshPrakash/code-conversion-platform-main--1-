// Simulated offline code conversion
// In a real implementation, this would use AST parsing and rule-based transformation

interface ConversionResult {
  code: string;
  explanation: string;
  warnings: string[];
}

const sampleConversions: Record<string, Record<string, (code: string, mode: string) => ConversionResult>> = {
  python: {
    javascript: (code: string, mode: string) => {
      let converted = code
        // Function definitions
        .replace(/def (\w+)\((.*?)\):/g, "function $1($2) {")
        // Print statements
        .replace(/print\((.*?)\)/g, "console.log($1)")
        // Comments
        .replace(/#(.*)$/gm, "//$1")
        // Boolean values
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false")
        .replace(/\bNone\b/g, "null")
        // String formatting
        .replace(/f"(.*?)"/g, '`$1`')
        .replace(/\{(\w+)\}/g, '${$1}')
        // Range to for loop
        .replace(/for (\w+) in range\((\d+)\):/g, "for (let $1 = 0; $1 < $2; $1++) {")
        .replace(/for (\w+) in range\((\d+),\s*(\d+)\):/g, "for (let $1 = $2; $1 < $3; $1++) {")
        // If/elif/else
        .replace(/elif/g, "} else if")
        .replace(/if (.+):/g, "if ($1) {")
        .replace(/else:/g, "} else {")
        // List comprehensions (basic)
        .replace(/\[(.+) for (\w+) in (.+)\]/g, "$3.map($2 => $1)")
        // Add closing braces for indented blocks
        .replace(/^(\s*)(.+)$/gm, (match, indent, content) => {
          return match;
        });

      // Add closing braces
      const lines = converted.split("\n");
      const result: string[] = [];
      let indentStack: number[] = [0];

      for (const line of lines) {
        const trimmed = line.trimStart();
        const currentIndent = line.length - trimmed.length;
        
        while (indentStack.length > 1 && currentIndent < indentStack[indentStack.length - 1]) {
          indentStack.pop();
          result.push(" ".repeat(indentStack[indentStack.length - 1]) + "}");
        }
        
        result.push(line);
        
        if (line.endsWith("{")) {
          indentStack.push(currentIndent + 2);
        }
      }

      while (indentStack.length > 1) {
        indentStack.pop();
        result.push("}");
      }

      return {
        code: result.join("\n"),
        explanation: `Converted Python to JavaScript using ${mode} mode:\n• Function definitions transformed to JavaScript syntax\n• Print statements converted to console.log\n• Python-specific values (True/False/None) replaced\n• Loop constructs adapted`,
        warnings: mode === "strict" 
          ? ["Some Python-specific features may not have direct equivalents"]
          : [],
      };
    },
    typescript: (code: string, mode: string) => {
      const jsResult = sampleConversions.python.javascript(code, mode);
      let tsCode = jsResult.code
        .replace(/function (\w+)\((.*?)\)/g, (match, name, params) => {
          const typedParams = params
            .split(",")
            .map((p: string) => p.trim())
            .filter((p: string) => p)
            .map((p: string) => `${p}: any`)
            .join(", ");
          return `function ${name}(${typedParams}): void`;
        })
        .replace(/let (\w+) = (\d+)/g, "let $1: number = $2")
        .replace(/let (\w+) = ["'`]/g, "let $1: string = \"")
        .replace(/let (\w+) = \[/g, "let $1: any[] = [");

      return {
        code: tsCode,
        explanation: jsResult.explanation + "\n• Added TypeScript type annotations",
        warnings: [...jsResult.warnings, "Type inference is basic - review and refine types"],
      };
    },
  },
  javascript: {
    python: (code: string, mode: string) => {
      let converted = code
        .replace(/function (\w+)\((.*?)\)\s*\{/g, "def $1($2):")
        .replace(/console\.log\((.*?)\)/g, "print($1)")
        .replace(/\/\/(.*)/g, "#$1")
        .replace(/\btrue\b/g, "True")
        .replace(/\bfalse\b/g, "False")
        .replace(/\bnull\b/g, "None")
        .replace(/\bundefined\b/g, "None")
        .replace(/const (\w+) = /g, "$1 = ")
        .replace(/let (\w+) = /g, "$1 = ")
        .replace(/var (\w+) = /g, "$1 = ")
        .replace(/for\s*\(let (\w+) = (\d+);\s*\1 < (\d+);\s*\1\+\+\)\s*\{/g, "for $1 in range($2, $3):")
        .replace(/\} else if \((.*?)\)\s*\{/g, "elif $1:")
        .replace(/if \((.*?)\)\s*\{/g, "if $1:")
        .replace(/\} else \{/g, "else:")
        .replace(/\}/g, "")
        .replace(/;$/gm, "");

      return {
        code: converted.trim(),
        explanation: `Converted JavaScript to Python using ${mode} mode:\n• Function syntax transformed to Python def\n• console.log converted to print\n• JavaScript-specific values replaced\n• Removed braces and semicolons`,
        warnings: [],
      };
    },
    typescript: (code: string, mode: string) => {
      let converted = code
        .replace(/function (\w+)\((.*?)\)/g, (match, name, params) => {
          const typedParams = params
            .split(",")
            .map((p: string) => p.trim())
            .filter((p: string) => p)
            .map((p: string) => `${p}: any`)
            .join(", ");
          return `function ${name}(${typedParams}): void`;
        })
        .replace(/const (\w+) = (\d+)/g, "const $1: number = $2")
        .replace(/let (\w+) = (\d+)/g, "let $1: number = $2")
        .replace(/const (\w+) = ["'`]/g, 'const $1: string = "')
        .replace(/let (\w+) = ["'`]/g, 'let $1: string = "');

      return {
        code: converted,
        explanation: `Converted JavaScript to TypeScript using ${mode} mode:\n• Added type annotations\n• Inferred types from value assignments`,
        warnings: ["Type inference is basic - review and refine types manually"],
      };
    },
  },
};

export function convertCode(
  sourceCode: string,
  sourceLanguage: string,
  targetLanguage: string,
  mode: string
): ConversionResult {
  if (sourceLanguage === targetLanguage) {
    return {
      code: sourceCode,
      explanation: "Source and target languages are the same. No conversion needed.",
      warnings: [],
    };
  }

  const converter = sampleConversions[sourceLanguage]?.[targetLanguage];
  
  if (converter) {
    return converter(sourceCode, mode);
  }

  // Generic fallback with placeholder conversion
  return {
    code: `// Converted from ${sourceLanguage} to ${targetLanguage}\n// Mode: ${mode}\n\n${sourceCode}\n\n// Note: This is a simulated conversion.\n// In production, AST-based transformation would be applied.`,
    explanation: `Simulated conversion from ${sourceLanguage} to ${targetLanguage}.\n\nFor full conversion support, integrate with:\n• Tree-sitter for AST parsing\n• Language-specific rule engines\n• Local LLM for semantic understanding`,
    warnings: [
      `Direct ${sourceLanguage} → ${targetLanguage} conversion rules are being developed`,
      "Review output carefully for accuracy",
    ],
  };
}
