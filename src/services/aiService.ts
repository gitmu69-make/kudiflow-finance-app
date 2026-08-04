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
    const response = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to analyze transactions");
    }

    return await response.json() as AiAnalysis;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const isApiKeyError = errorMsg.includes("API Key") || 
                          errorMsg.includes("API key") || 
                          errorMsg.includes("key is invalid") || 
                          errorMsg.includes("Key is invalid") ||
                          errorMsg.includes("INVALID_ARGUMENT") ||
                          errorMsg.includes("API_KEY_INVALID");
    
    if (isApiKeyError) {
      console.warn("AI Analysis Configuration Notice:", errorMsg);
      return {
        totalSpending: "N/A",
        topCategory: "N/A",
        insight: "Gemini API Key is not configured or is invalid.",
        recommendation: "Please verify or set up a valid Gemini API Key in your AI Studio Settings (the gear icon at the bottom left) to unlock active cashflow insights."
      };
    }

    console.error("AI Analysis failed:", error);
    return {
      totalSpending: "N/A",
      topCategory: "N/A",
      insight: "AI Analysis is temporarily unavailable.",
      recommendation: "Please try again later."
    };
  }
};
