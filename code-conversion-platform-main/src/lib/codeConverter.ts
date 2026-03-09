import { GoogleGenAI, Type } from "@google/genai";

interface ConversionResult {
  code: string;
  explanation: string;
  warnings: string[];
}

export async function convertCode(
  sourceCode: string,
  sourceLanguage: string,
  targetLanguage: string,
  mode: string
): Promise<ConversionResult> {
  if (sourceLanguage === targetLanguage) {
    return {
      code: sourceCode,
      explanation: "Source and target languages are the same. No conversion needed.",
      warnings: [],
    };
  }

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'convert',
        sourceCode,
        sourceLanguage,
        targetLanguage,
        mode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.statusText}`);
    }

    const resultData = await response.json() as ConversionResult;
    return resultData;
  } catch (error) {
    console.error("Proxy Conversion Error:", error);
    return {
      code: sourceCode,
      explanation: "An error occurred connecting to the secure AI proxy. The original code is displayed above.",
      warnings: [String(error)],
    };
  }
}

export async function generateCode(promptText: string, language: string): Promise<string> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate',
        promptText,
        sourceLanguage: language,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.statusText}`);
    }

    const resultData = await response.json();
    return resultData.code;
  } catch (error) {
    console.error("Proxy Code Gen Error:", error);
    return `// An error occurred during the secure proxy request:\n// ${String(error)}`;
  }
}

