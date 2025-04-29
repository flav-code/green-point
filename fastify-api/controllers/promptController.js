// fastify-api/controllers/promptController.js
import { ollamaService } from '../services/ollamaService.js';

/**
 * Controller for handling prompt evaluations and team score updates
 */
export const promptController = {
    /**
     * Evaluate a prompt and update team scores based on eco-responsibility
     * @param {FastifyRequest} request - The Fastify request object
     * @param {FastifyReply} reply - The Fastify reply object
     * @returns {Promise<object>} The evaluation result and updated team info
     */
    async evaluatePrompt(request, reply) {
        const { prompt, userId, teamId } = request.body;

        console.log(`Processing prompt evaluation request: userId=${userId}, teamId=${teamId}`);
        console.log(`Prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);

        if (!prompt || !teamId) {
            console.log("Error: Missing required fields");
            return reply.code(400).send({
                success: false,
                error: 'Missing required fields: prompt, teamId'
            });
        }

        try {
            // Get evaluation from Ollama
            console.log("Sending prompt to Ollama for evaluation");
            const evaluation = await ollamaService.evaluatePrompt(prompt);
            console.log(`Evaluation result: isEcoResponsible=${evaluation.isEcoResponsible}, score=${evaluation.score}`);

            // Update team score based on evaluation
            const pointChange = evaluation.isEcoResponsible ? 10 : -10;
            console.log(`Updating team ${teamId} score by ${pointChange} points`);

            try {
                // Call the team score update function
                const updatedTeam = await request.server.updateTeamScore(teamId, pointChange);
                console.log(`Team score updated successfully: new score=${updatedTeam.score}`);

                return {
                    success: true,
                    evaluation: {
                        isEcoResponsible: evaluation.isEcoResponsible,
                        score: evaluation.score,
                        explanation: evaluation.explanation,
                        response: evaluation.response
                    },
                    teamUpdate: {
                        teamId,
                        newScore: updatedTeam.score,
                        pointChange
                    }
                };
            } catch (teamError) {
                console.error("Error updating team score:", teamError);
                // Return evaluation even if team update fails
                return {
                    success: true,
                    evaluation: {
                        isEcoResponsible: evaluation.isEcoResponsible,
                        score: evaluation.score,
                        explanation: evaluation.explanation,
                        response: evaluation.response
                    },
                    teamUpdate: {
                        teamId,
                        newScore: 0, // Placeholder since update failed
                        pointChange
                    },
                    teamUpdateError: teamError.message
                };
            }
        } catch (error) {
            console.error('Error in promptController.evaluatePrompt:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to evaluate prompt: ' + error.message
            });
        }
    }
};

export default promptController;