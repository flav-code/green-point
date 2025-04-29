// fastify-api/services/ollamaService.js
import fetch from 'node-fetch';

/**
 * Service to interact with locally running Ollama instance
 */
export const ollamaService = {
    /**
     * Check if a prompt is eco-responsible by querying the deepseek-r1 model
     * @param {string} prompt - The user's prompt to evaluate
     * @returns {Promise<{isEcoResponsible: boolean, response: string}>}
     */
    async evaluatePrompt(prompt) {
        try {
            // System instructions to determine eco-responsibility
            const systemPrompt = `
You are an AI assistant that evaluates if user prompts are eco-responsible.
Eco-responsible prompts are:
- Clear, concise, and specific
- Avoid unnecessary politeness formulas
- Don't ask for information that could be easily searched online
- Well-structured with relevant context
- Focused on a single question rather than multiple questions
- Between 15-60 words in length

Evaluate the following prompt and respond in JSON format with:
{ 
  "isEcoResponsible": true/false, 
  "score": 0-100 (higher means more eco-responsible),
  "explanation": "brief explanation of the evaluation",
  "response": "your response to the user" 
}`;

            const response = await fetch("http://localhost:11434/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "deepseek-r1",
                    prompt: `${systemPrompt}\n\nUser prompt: ${prompt}`,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        num_predict: 2048
                    }
                })
            });

            const data = await response.json();

            // Parse the response to extract the JSON
            let jsonStart = data.response.indexOf('{');
            let jsonEnd = data.response.lastIndexOf('}') + 1;

            if (jsonStart === -1 || jsonEnd === 0) {
                // Fallback if the model didn't return proper JSON
                return {
                    isEcoResponsible: false,
                    score: 30,
                    explanation: "Could not evaluate the prompt properly",
                    response: data.response
                };
            }

            const jsonStr = data.response.substring(jsonStart, jsonEnd);
            const result = JSON.parse(jsonStr);

            return {
                isEcoResponsible: result.isEcoResponsible,
                score: result.score || 50,
                explanation: result.explanation || "",
                response: result.response || data.response
            };
        } catch (error) {
            console.error('Error evaluating prompt with Ollama:', error);
            return {
                isEcoResponsible: false,
                score: 0,
                explanation: "Error processing the prompt",
                response: "I couldn't process your request. Please try again."
            };
        }
    }
};

export default ollamaService;