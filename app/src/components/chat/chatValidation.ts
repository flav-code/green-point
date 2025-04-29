import {PromptValidationStatus} from "../../types";

/**
 * Validates a prompt for various efficiency criteria
 * @param prompt The prompt text to validate
 * @returns Validation status object with status and message
 */
export const validatePrompt = (prompt: string): PromptValidationStatus => {
    if (!prompt || prompt.trim().length === 0) {
        return { status: 'idle', message: '' };
    }

    const trimmedPrompt = prompt.trim();
    const wordCount = trimmedPrompt.split(/\s+/).length;

    // Check for word count
    if (wordCount < 6) {
        return {
            status: 'error',
            message: 'Prompt is too short and will be blocked. Please be more specific.'
        };
    } else if (wordCount > 100) {
        return {
            status: 'error',
            message: 'Prompt is too long and will consume excessive energy. Please be more concise.'
        };
    } else if (wordCount < 15) {
        return {
            status: 'warning',
            message: 'Your prompt is too short for optimal efficiency. Aim for 15-60 words.'
        };
    } else if (wordCount > 60) {
        return {
            status: 'warning',
            message: 'Your prompt is getting too long. Aim for 15-60 words for optimal energy usage.'
        };
    } else {
        return {
            status: 'valid',
            message: 'Great prompt length! This is energy efficient.'
        };
    }
};

/**
 * Checks if a prompt contains politeness formulas which are discouraged
 * @param text The text to check for politeness formulas
 * @returns Boolean indicating if politeness formulas were found
 */
export const hasPolitenessFormula = (text: string): boolean => {
    const politenessRegex = /\b(hello|hi|hey|good\s+(morning|afternoon|evening)|evening|morning|goodbye|bye|thanks|thank\s+you|please)\b/i;
    return politenessRegex.test(text);
};

/**
 * Returns the appropriate error message for a short prompt
 * @returns The error message for short prompts
 */
export const getShortPromptMessage = (): string => {
    return "Are you that lazy? If you ask me precisely what you need, I will consume less energy. Stop writing very short prompts please.";
};

/**
 * Returns the appropriate error message for a prompt with politeness formulas
 * @returns The error message for politeness formulas
 */
export const getPolitenessFormulaMessage = (): string => {
    return "Greeting me is not eco-responsible, you make me consume more energy than I really need. You forgot that I'm not human, think twice before writing!";
};