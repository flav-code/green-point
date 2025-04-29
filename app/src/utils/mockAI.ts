import { EnergyMetrics } from "../types";
import { v4 as uuidv4 } from "uuid";

// Simulates AI response with energy usage metrics
export const simulateAIResponse = async (prompt: string): Promise<{ response: string; metrics: EnergyMetrics }> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  const promptLength = prompt.length;
  const promptComplexity = calculateComplexity(prompt);
  
  // Calculate energy usage based on prompt length and complexity
  const energyUsage = calculateEnergyUsage(promptLength, promptComplexity);
  
  // Determine efficiency rating
  const efficiency = determineEfficiency(energyUsage);
  
  // Generate suggestions for inefficient prompts
  const suggestions = efficiency === 'low' ? generateSuggestions(prompt) : undefined;
  
  return {
    response: generateResponse(prompt),
    metrics: {
      usage: energyUsage,
      efficiency,
      suggestions
    }
  };
};

// Calculate complexity score (0-1) based on prompt characteristics
const calculateComplexity = (prompt: string): number => {
  const hasComplexQuestions = /\b(why|how|explain|describe|analyze|compare|evaluate)\b/i.test(prompt);
  const multipleQuestions = (prompt.match(/\?/g) || []).length > 1;
  const wordCount = prompt.split(/\s+/).length;
  
  let complexityScore = 0;
  
  if (wordCount > 50) complexityScore += 0.3;
  else if (wordCount > 20) complexityScore += 0.15;
  
  if (hasComplexQuestions) complexityScore += 0.2;
  if (multipleQuestions) complexityScore += 0.2;
  
  return Math.min(complexityScore, 1);
};

// Calculate energy usage (0-100) based on prompt characteristics
const calculateEnergyUsage = (length: number, complexity: number): number => {
  // Base energy usage from 10-80 based on length and complexity
  const baseEnergy = 10 + (length / 10) * (1 + complexity * 2);
  
  // Add some randomness
  const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  
  // Ensure energy is between 0-100
  return Math.min(Math.round(baseEnergy * randomFactor), 100);
};

// Determine efficiency rating based on energy usage
const determineEfficiency = (energyUsage: number): 'high' | 'medium' | 'low' => {
  if (energyUsage < 30) return 'high';
  if (energyUsage < 60) return 'medium';
  return 'low';
};

// Generate suggestions for improving prompt efficiency
const generateSuggestions = (prompt: string): string[] => {
  const suggestions = [
    "Be more specific in your question",
    "Break complex questions into smaller ones",
    "Avoid asking multiple questions at once",
    "Use keywords instead of full sentences when possible",
    "Specify exactly what information you need",
    "Remove unnecessary context and details"
  ];
  
  // Return random subset of suggestions
  return suggestions
    .sort(() => 0.5 - Math.random())
    .slice(0, 1 + Math.floor(Math.random() * 2));
};

// Generate a simple AI response based on the prompt
const generateResponse = (prompt: string): string => {
  const responses = [
    `I've analyzed your request: "${prompt.slice(0, 30)}..." and found the following information:`,
    `Based on your prompt, I can provide the following insights:`,
    `Here's what I know about "${prompt.slice(0, 30)}...":`,
    `Thank you for your question. Here's my response:`,
    `I've processed your query and here's what I found:`
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  // Generate a somewhat relevant response based on the prompt
  let details = "";
  
  if (/\b(what|who|where|when)\b/i.test(prompt)) {
    details = "The specific information you're looking for relates to " + 
      generateRandomFact() + ". This is based on the latest data available to me.";
  } else if (/\b(why|how)\b/i.test(prompt)) {
    details = "The process involves several key factors: " + 
      generateRandomFactList(3) + ". These elements work together to create the outcome you're asking about.";
  } else if (/\b(compare|difference|versus|vs)/i.test(prompt)) {
    details = "The main differences include: " + 
      generateRandomFactList(2) + ". However, they share some similarities such as " + 
      generateRandomFact() + ".";
  } else {
    details = "Based on available information, " + 
      generateRandomFact() + ". Additionally, " + 
      generateRandomFact() + ".";
  }
  
  return `${randomResponse}\n\n${details}\n\nIs there anything specific about this you'd like me to elaborate on?`;
};

// Generate random facts for the AI responses
const generateRandomFact = (): string => {
  const facts = [
    "sustainable AI practices can reduce energy consumption by up to 40%",
    "optimized prompting techniques save approximately 23% of computational resources",
    "cloud-based AI services offer a 62% reduction in carbon footprint compared to on-premises solutions",
    "proper query formulation can decrease processing time by 35%",
    "AI system efficiency has improved by 78% in the last five years",
    "modern language models require significantly less energy per token than previous generations",
    "implementing regular maintenance cycles can extend AI hardware lifecycle by 30%",
    "distributed computing approaches can reduce peak energy demands by 55%"
  ];
  
  return facts[Math.floor(Math.random() * facts.length)];
};

// Generate a list of random facts
const generateRandomFactList = (count: number): string => {
  const factList = [];
  const usedIndices = new Set();
  
  const facts = [
    "reduced computational complexity",
    "optimized memory usage",
    "improved algorithm efficiency",
    "better resource allocation",
    "enhanced data preprocessing",
    "streamlined model architecture",
    "reduced redundancy in operations",
    "more efficient data handling"
  ];
  
  while (factList.length < count && factList.length < facts.length) {
    const index = Math.floor(Math.random() * facts.length);
    if (!usedIndices.has(index)) {
      factList.push(facts[index]);
      usedIndices.add(index);
    }
  }
  
  return factList.join(", ");
};