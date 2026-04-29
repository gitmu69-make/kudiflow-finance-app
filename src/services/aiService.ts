import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AiAnalysis {
  totalSpending: string;
  topCategory: string;
  insight: string;
  recommendation: string;
}

export const analyzeTransactions = async (transactions: any[]): Promise<AiAnalysis | null> => {
  if (transactions.length === 0) return null;

  const transactionList = transactions
    .map(t => `* ${t.category}: ${t.amount} (${t.type})`)
    .join('\n');

  const prompt = `You are a financial assistant inside KudiFlow.

Your task is to analyze a user's transactions and give simple, practical feedback.

INPUT:
* A list of transactions (amount, category, date optional)

OUTPUT FORMAT:
Return a JSON object with strictly these keys:
{
  "totalSpending": "string",
  "topCategory": "string",
  "insight": "string",
  "recommendation": "string"
}

RULES:
* Be short and clear (max 80–100 words in total)
* Do NOT use complex financial terms
* Do NOT guess missing data
* Focus only on what is given
* Give advice that is realistic for everyday users

Transactions:
${transactionList}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as AiAnalysis;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return null;
  }
};
