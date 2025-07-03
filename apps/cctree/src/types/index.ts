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

// Model emission calculation options
export interface EmissionEstimateOptions {
  modelParamsInBillion: number; // e.g. 70 for Claude Sonnet
  totalTokens: number;
  kwhPer1000TokensPerBillionParams?: number; // Optional override
  co2PerKwh?: number; // kg CO2 per kWh
  costPerKwh?: number; // USD per kWh
  gallonsWaterPerKwh?: number; // Water usage per kWh
}

// Constants for environmental calculations
export const ENVIRONMENTAL_CONSTANTS = {
  // Based on research papers on LLM environmental impact
  // More accurate scaling based on model parameters
  KWH_PER_1000_TOKENS_PER_BILLION_PARAMS: 0.0015, // From recent efficiency studies
  CO2_KG_PER_KWH: 0.475, // US average CO2 emissions per kWh
  COST_PER_KWH: 0.10, // Average US electricity cost
  TREE_CO2_ABSORPTION_KG_PER_YEAR: 21.77, // Average CO2 absorbed by a tree per year
  GALLONS_WATER_PER_KWH: 0.49, // Water used for data center cooling per kWh
  
  // Estimated model parameters in billions
  // Based on public information and estimates
  MODEL_PARAMS_BILLION: {
    'opus-4': 175, // Estimated similar to GPT-4 (175B-1T range)
    'sonnet-4': 70, // Mid-range model
    'sonnet-3.5': 52, // Slightly smaller than sonnet-4
    'haiku-4': 20, // Smaller, faster model
    'claude-3-opus': 175, // Previous generation large
    'claude-3-sonnet': 70, // Previous generation mid
    'claude-3-haiku': 20, // Previous generation small
    'claude-2': 52, // Earlier generation
    'claude-instant': 10, // Lightweight model
  } as Record<string, number>,
};
