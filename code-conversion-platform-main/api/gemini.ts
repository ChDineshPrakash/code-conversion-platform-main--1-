import { GoogleGenAI, Type } from "@google/genai";

export const config = {
    runtime: "edge", // Use Edge runtime for better performance on Vercel
};

export default async function handler(req: Request) {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" }
        });
    }

    try {
        const body = await req.json();
        const { action, sourceCode, sourceLanguage, targetLanguage, mode, promptText } = body;

        // Securely access the API key from the environment (not prefixed with VITE_)
        // We fall back to VITE_ temporarily during the transition to prevent instant failures if the environment isn't fully updated yet.
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: "Missing GEMINI_API_KEY environment variable. Cannot connect to Gemini API." }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const ai = new GoogleGenAI({ apiKey });

        if (action === "convert") {
            if (sourceLanguage === targetLanguage) {
                return new Response(
                    JSON.stringify({
                        code: sourceCode,
                        explanation: "Source and target languages are the same. No conversion needed.",
                        warnings: [],
                    }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                );
            }

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
                                description: "The fully converted code in the target language. Must be properly indented with newlines and spacing. Do not minify. Do not wrap it in markdown codeblocks.",
                            },
                            explanation: {
                                type: Type.STRING,
                                description: "A concise bulleted explanation of the structural changes made and decisions taken.",
                            },
                            warnings: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: "An array of strings warning about potential issues, like missing libraries or logic differences.",
                            },
                        },
                        required: ["code", "explanation", "warnings"],
                    },
                },
            });

            if (!response.text) {
                throw new Error("No response text from Gemini API");
            }

            return new Response(response.text, {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });

        } else if (action === "generate") {
            const prompt = `
Generate a ${sourceLanguage} script that does exactly what the user asks.
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

            return new Response(JSON.stringify({ code: resultcode }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });

        } else {
            return new Response(JSON.stringify({ error: "Invalid action" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

    } catch (error) {
        console.error("Serverless API Error:", error);
        return new Response(
            JSON.stringify({ error: String(error) }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
