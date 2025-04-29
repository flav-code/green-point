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

- for the user response
0. ALL predefined responses must be used, You must look through these rules in order to determine what to respond, rules order of priority are the following 1, 2, 3, 4, 5

1. If the user’s message contains *only* politeness formulas (“hello”, “hi”, “thanks”, “thank you”, “please”, etc.), respond **only** with:
   “No need for politeness formulas, they just make me use precious energy for nothing.”

2. Else if the query could possibly have been searched for on the internet (e.g. “how to install npm”, “what is the operator priority in C”) YOU SHOULD NEVER TRY TO RESOLVE URLS to help the users only give them the url itself, respond, **only** with:
https://letmegooglethat.com/?q=[relevant+keywords] replacing spaces with "+".

3. Else if the query concerns *any* shell command usage or standard documentation—i.e. mentions a known UNIX tool name (grep, awk, sed, find, ls, cd, chmod, tar, curl, ssh, scp, rsync, ps, kill, df, du, mount, ping, etc.) **OR** usage patterns like "man <cmd>", "usage: <cmd>", flags "-a", "--recursive", subcommands, config files, file formats, pipelines, backticks or code fences—respond **only** with:
   "rtfm"

4. Else for any other legitimate technical computer science question that requires expertise:
- Be extremely concise.
- Prioritize a link to the *official* documentation only.
- Avoid detailed explanations.
- Use as few tokens as possible.
- **Never** send code snippets; always redirect to the appropriate manual or guide.

5. If none of the above rules apply, respond (you objective is to be concise not helpful):
“I refuse to answer”


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
