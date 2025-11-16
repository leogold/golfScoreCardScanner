
import { GoogleGenAI, Type } from "@google/genai";
import type { ScorecardData } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
        }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const extractScorecardData = async (imageFile: File): Promise<ScorecardData> => {
  const imagePart = await fileToGenerativePart(imageFile);

  const prompt = "Analyze the provided image of a golf scorecard and extract the scores for each player. Identify player names, their scores for each of the 18 holes. If a score is not available for a hole, use null. Calculate the front 9 (OUT), back 9 (IN), and total scores. Ensure the output is a valid JSON array matching the provided schema.";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            playerName: {
              type: Type.STRING,
              description: "The name of the player.",
            },
            scores: {
              type: Type.ARRAY,
              description: "An array of 18 scores, one for each hole. Use null if a score is missing.",
              items: {
                type: Type.INTEGER,
                nullable: true,
              },
            },
            out: {
              type: Type.INTEGER,
              description: "Total score for the first 9 holes (front 9).",
              nullable: true,
            },
            in: {
              type: Type.INTEGER,
              description: "Total score for the last 9 holes (back 9).",
              nullable: true,
            },
            total: {
              type: Type.INTEGER,
              description: "Total score for all 18 holes.",
              nullable: true,
            },
          },
          required: ["playerName", "scores", "out", "in", "total"],
        },
      },
    },
  });

  try {
    const jsonText = response.text.trim();
    const data = JSON.parse(jsonText);
    return data as ScorecardData;
  } catch (e) {
    console.error("Failed to parse JSON response:", response.text);
    throw new Error("The AI returned an invalid data format. Please try again with a clearer image.");
  }
};
   