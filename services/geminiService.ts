
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini API client using the environment variable directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = "Du är en världsledande expert på ISO 9001, 14001 och 45001. Din uppgift är att hjälpa företag att bli certifierade genom att ge konkreta, praktiska och lätthanterliga råd på svenska. Var professionell men pedagogisk.";

export const generateISOTemplate = async (topic: string, standard: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Skapa en professionell företagsmall för följande ämne inom ISO ${standard}: "${topic}". Inkludera rubriker, syfte, ansvar och en tabell för uppföljning. Svara på svenska. Använd Markdown för formatering.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Ett fel uppstod vid generering av mallen.";
  }
};

export const suggestAnnualPlan = async (standards: string[]) => {
  try {
    // Using responseSchema to ensure the model returns a valid JSON array of objects with correct types.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Skapa en årsplan (årshjul) för ett företag som ska certifieras enligt ${standards.join(', ')}. Ge förslag på minst en viktig aktivitet per månad (t.ex. skyddsrond, internrevision, ledningens genomgång, intressentanalys). Svara i JSON-format.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              month: {
                type: Type.INTEGER,
                description: 'Månadens index (0 för januari, 11 för december).',
              },
              title: {
                type: Type.STRING,
                description: 'Namnet på aktiviteten.',
              },
              type: {
                type: Type.STRING,
                description: 'Typ av aktivitet: revision, rond, möte, utbildning eller mätning.',
              },
              description: {
                type: Type.STRING,
                description: 'Kort motivering eller beskrivning av aktiviteten.',
              },
            },
            required: ["month", "title", "type", "description"],
          },
        },
      },
    });
    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Gemini API error:", error);
    return null;
  }
};

export const suggestRequiredDocuments = async (chapter: string, standard: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Lista vilka specifika dokument (rutiner, processer, bilagor) som krävs eller rekommenderas för kapitel ${chapter} i ISO ${standard}. Svara kortfattat på svenska i punktform.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.5,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Kunde inte hämta förslag.";
  }
};

export const getISOAdvice = async (chapter: string, standard: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Förklara kapitel ${chapter} i ISO ${standard} och ge 3 konkreta steg för att uppfylla det. Svara på svenska.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.5,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Kunde inte hämta råd just nu.";
  }
};

export const askISOConsultant = async (query: string, history: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Jag kunde tyvärr inte svara på det just nu.";
  }
};
