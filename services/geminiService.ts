
import { GoogleGenAI } from "@google/genai";
import { BibleVerse, Reflection } from "../types";

export const generateReflection = async (verse: BibleVerse): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a short, 2-sentence spiritual reflection for a "Servant of Christ" based on this verse: "${verse.text}" (${verse.reference}). Keep it encouraging and focused on service and faith.`,
      config: {
        temperature: 0.7,
        topP: 0.8,
      }
    });

    return response.text?.trim() || "Let this word guide your heart as you serve the Lord today.";
  } catch (error) {
    console.error("Error generating reflection:", error);
    return "Reflect on how God's love empowers you to be a faithful servant in all your works.";
  }
};
