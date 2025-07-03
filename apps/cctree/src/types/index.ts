export interface TokenUsageData {
  date: string;
  models: string;
  input: number;
  output: number;
  cacheCreate: number;
  cacheRead: number;
  totalTokens: number;
  cost: number;
}

export interface EnvironmentalImpact {
  energyUsageKWh: number; // Energy usage in kilowatt-hours
  co2EmissionsKg: number; // CO2 emissions in kilograms
  co2EquivalentTreesNeeded: number; // Number of trees needed to offset CO2
  waterUsageGallons: number; // Water usage for cooling in gallons
}

export interface ExtendedUsageData extends TokenUsageData {
  environmental: EnvironmentalImpact;
}

// Constants for environmental calculations
export const ENVIRONMENTAL_CONSTANTS = {
  // Based on research papers on LLM environmental impact
  // Sources: "The Carbon Footprint of ChatGPT" and similar studies
  KWH_PER_MILLION_TOKENS: 0.294, // kWh per million tokens (conservative estimate)
  CO2_KG_PER_KWH: 0.475, // US average CO2 emissions per kWh
  TREE_CO2_ABSORPTION_KG_PER_YEAR: 21.77, // Average CO2 absorbed by a tree per year
  GALLONS_WATER_PER_KWH: 0.49, // Water used for data center cooling per kWh

  // Model efficiency multipliers (relative to base model)
  MODEL_EFFICIENCY: {
    'opus-4': 1.5, // Larger model, more energy intensive
    'sonnet-4': 1.0, // Base model
    'haiku-4': 0.7, // Smaller model, more efficient
  } as Record<string, number>,
};
