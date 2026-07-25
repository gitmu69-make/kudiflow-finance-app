export interface AiAnalysis {
  totalSpending: string;
  topCategory: string;
  insight: string;
  recommendation: string;
}

const safeParseAIResponse = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI response was not valid JSON');
    }
    return JSON.parse(jsonMatch[0]);
  }
};

const isValidAiAnalysis = (result: any): result is AiAnalysis => {
  return (
    result &&
    typeof result.totalSpending === 'string' &&
    typeof result.topCategory === 'string' &&
    typeof result.insight === 'string' &&
    typeof result.recommendation === 'string'
  );
};

export const analyzeTransactions = async (transactions: any[]): Promise<AiAnalysis | null> => {
  if (transactions.length === 0) return null;

  const transactionList = transactions
    .map(t => `* ${t.category || 'General'}: GHS ${t.amount.toFixed(2)} (${t.type})`)
    .join('\n');

  const prompt = `You are a friendly financial assistant inside KudiFlow.

Your task is to analyze a user's recent transactions and give simple, practical feedback.

INPUT:
* A list of transactions with amount, category, and type

OUTPUT FORMAT:
Return only valid JSON with these exact keys and no extra text:
{
  "totalSpending": "string",
  "topCategory": "string",
  "insight": "string",
  "recommendation": "string"
}

RULES:
* Be short and clear (max 80-100 words total)
* Do NOT use complex financial terms
* Do NOT guess missing data
* Focus only on the transactions provided
* Use the exact totals from the list

Transactions:
${transactionList}
`;

  try {
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      let errorMessage = 'Failed to analyze transactions';
      try {
        const errorData = JSON.parse(responseText);
        if (errorData?.error) errorMessage = errorData.error;
      } catch {
        // ignore parse errors
      }
      throw new Error(errorMessage);
    }

    const result = safeParseAIResponse(responseText);
    if (!isValidAiAnalysis(result)) {
      throw new Error('AI returned an invalid analysis format.');
    }

    return result;
  } catch (error: any) {
    console.error('AI Analysis failed:', error);
    return {
      totalSpending: 'N/A',
      topCategory: 'N/A',
      insight: 'AI Analysis is temporarily unavailable.',
      recommendation: 'Please try again later.',
      error: error?.message || 'Unknown AI service error.'
    };
  }
};
