import { GoogleGenAI, Type } from "@google/genai";

interface ConversionResult {
  code: string;
  explanation: string;
  warnings: string[];
}

// In a real application, you'd want to securely proxy this through a backend.
// For this local offline/dev version, we use an env variable directly.
const getGeminiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

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

  const ai = getGeminiClient();

  if (!ai) {
    return {
      code: `// Missing VITE_GEMINI_API_KEY environment variable.\n// Cannot connect to Gemini API.\n\n${sourceCode}`,
      explanation: `To enable real AI code conversion, please add VITE_GEMINI_API_KEY to your .env file.\nCurrently simulating failed conversion.`,
      warnings: ["VITE_GEMINI_API_KEY environment variable is not set."],
    };
  }

  try {
    const prompt = `
Convert the following ${sourceLanguage} code to ${targetLanguage}.
Use a "${mode}" coding style.
Ensure the code is formatted beautifully with proper indentation, spacing, and newlines. Do not minify the code.
Ensure you return your response EXACTLY matching the required JSON schema.

Code to convert:
\`\`\`${sourceLanguage}
${sourceCode}
\`\`\`
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            code: {
              type: Type.STRING,
              description: "The fully converted code in the target language. Must be properly indented with newlines and spacing. Do not minify. Do not wrap it in markdown codeblocks like ```.",
            },
            explanation: {
              type: Type.STRING,
              description: "A concise bulleted explanation of the structural changes made and decisions taken during conversion.",
            },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "An array of strings warning about potential issues, like missing libraries, slightly differing logic, or type inference guesses.",
            },
          },
          required: ["code", "explanation", "warnings"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No response text from Gemini API");
    }

    const resultData = JSON.parse(response.text) as ConversionResult;
    return resultData;
  } catch (error) {
    console.error("Gemini Conversion Error:", error);
    return {
      code: sourceCode,
      explanation: "An error occurred during API conversion. The original code is displayed above.",
      warnings: [String(error)],
    };
  }
}

export async function generateCode(promptText: string, language: string): Promise<string> {
  const ai = getGeminiClient();

  if (!ai) {
    return `// Missing VITE_GEMINI_API_KEY environment variable.\n// Cannot connect to Gemini API to generate code.`;
  }

  try {
    const prompt = `
Generate a ${language} script that does exactly what the user asks.
Do not wrap it in markdown blockquotes like \`\`\`.
Only return the raw code, fully functional, properly indented, without any conversational text before or after.
DO NOT include any code comments (e.g., no // or # annotations).
Write the code so that it is extremely simple and easy for a beginner to understand. Avoid advanced syntax, code golf, or over-engineering.
DO NOT wrap the code in functions or classes unless absolutely necessary. Write it as procedural, inline code using global scope variables.
User request: "${promptText}"
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "text/plain",
      },
    });

    if (!response.text) {
      throw new Error("No response text from Gemini API");
    }

    let resultcode = response.text.trim();
    if (resultcode.startsWith("\`\`\`")) {
      resultcode = resultcode.replace(/^\`\`\`[a-zA-Z]*\n/, "").replace(/\n\`\`\`$/, "");
    }
    return resultcode;

  } catch (error) {
    console.error("Gemini Code Gen Error:", error);
    return `// An error occurred during Gemini request:\n// ${String(error)}`;
  }
}

