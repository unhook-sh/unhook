import {
  ENVIRONMENTAL_CONSTANTS,
  type EnvironmentalImpact,
  type TokenUsageData,
  type EmissionEstimateOptions,
} from '../types/index.js';

/**
 * Estimate LLM emissions based on model parameters and token usage
 * More accurate than simple multipliers as it scales with actual model size
 */
export function estimateLLMEmissions({
  modelParamsInBillion,
  totalTokens,
  kwhPer1000TokensPerBillionParams = ENVIRONMENTAL_CONSTANTS.KWH_PER_1000_TOKENS_PER_BILLION_PARAMS,
  co2PerKwh = ENVIRONMENTAL_CONSTANTS.CO2_KG_PER_KWH,
  costPerKwh = ENVIRONMENTAL_CONSTANTS.COST_PER_KWH,
  gallonsWaterPerKwh = ENVIRONMENTAL_CONSTANTS.GALLONS_WATER_PER_KWH,
}: EmissionEstimateOptions): EnvironmentalImpact & { energyCostUsd: number } {
  // Energy used scales with model size and token count
  const energyUsageKWh = (totalTokens / 1000) * kwhPer1000TokensPerBillionParams * modelParamsInBillion;
  
  const co2EmissionsKg = energyUsageKWh * co2PerKwh;
  const energyCostUsd = energyUsageKWh * costPerKwh;
  const waterUsageGallons = energyUsageKWh * gallonsWaterPerKwh;
  
  // Calculate equivalent trees needed (yearly absorption)
  const co2EquivalentTreesNeeded = co2EmissionsKg / ENVIRONMENTAL_CONSTANTS.TREE_CO2_ABSORPTION_KG_PER_YEAR;
  
  return {
    energyUsageKWh: parseFloat(energyUsageKWh.toFixed(4)),
    co2EmissionsKg: parseFloat(co2EmissionsKg.toFixed(4)),
    co2EquivalentTreesNeeded: parseFloat(co2EquivalentTreesNeeded.toFixed(2)),
    waterUsageGallons: parseFloat(waterUsageGallons.toFixed(2)),
    energyCostUsd: parseFloat(energyCostUsd.toFixed(2)),
  };
}

/**
 * Get model parameters for a given model name
 */
function getModelParams(modelName: string): number {
  // Clean and normalize model name
  const cleanName = modelName.toLowerCase().trim();
  
  // Try exact match first
  if (ENVIRONMENTAL_CONSTANTS.MODEL_PARAMS_BILLION[cleanName]) {
    return ENVIRONMENTAL_CONSTANTS.MODEL_PARAMS_BILLION[cleanName];
  }
  
  // Try to match known patterns
  for (const [key, value] of Object.entries(ENVIRONMENTAL_CONSTANTS.MODEL_PARAMS_BILLION)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return value;
    }
  }
  
  // Default to Sonnet-4 size if unknown
  console.warn(`Unknown model: ${modelName}, defaulting to 70B parameters`);
  return 70;
}

/**
 * Calculate environmental impact based on token usage
 * Now uses parameter-based calculation for more accuracy
 */
export function calculateEnvironmentalImpact(usage: TokenUsageData): EnvironmentalImpact {
  // Handle multiple models by taking the first one or averaging
  const models = usage.models.split(",").map(m => m.trim());
  let totalParams = 0;
  
  // If multiple models, calculate weighted average based on assumed equal usage
  for (const model of models) {
    totalParams += getModelParams(model);
  }
  const avgParams = totalParams / models.length;
  
  const result = estimateLLMEmissions({
    modelParamsInBillion: avgParams,
    totalTokens: usage.totalTokens,
  });
  
  // Remove energyCostUsd from the result as it's not in EnvironmentalImpact interface
  const { energyCostUsd, ...environmentalImpact } = result;
  
  return environmentalImpact;
}

/**
 * Format environmental metrics for display
 */
export function formatEnvironmentalMetrics(impact: EnvironmentalImpact): {
  energy: string;
  co2: string;
  trees: string;
  water: string;
} {
  return {
    energy: `${impact.energyUsageKWh.toFixed(3)} kWh`,
    co2: `${impact.co2EmissionsKg.toFixed(3)} kg`,
    trees: `${impact.co2EquivalentTreesNeeded.toFixed(1)} trees`,
    water: `${impact.waterUsageGallons.toFixed(1)} gal`,
  };
}

/**
 * Get human-readable comparisons for environmental impact
 */
export function getEnvironmentalComparisons(impact: EnvironmentalImpact): string[] {
  const comparisons: string[] = [];
  
  // Energy comparisons
  const phoneCharges = Math.round(impact.energyUsageKWh / 0.012); // iPhone charge ~12Wh
  if (phoneCharges > 0) {
    comparisons.push(`≈ ${phoneCharges} smartphone charges`);
  }
  
  // CO2 comparisons
  const milesDriven = Math.round(impact.co2EmissionsKg / 0.404); // Average car emits 404g CO2/mile
  if (milesDriven > 0) {
    comparisons.push(`≈ ${milesDriven} miles driven`);
  }
  
  // Water comparisons
  const showers = Math.round(impact.waterUsageGallons / 17); // Average shower uses 17 gallons
  if (showers > 0) {
    comparisons.push(`≈ ${showers} showers`);
  }
  
  return comparisons;
}

/**
 * Get detailed environmental report for a model
 */
export function getModelEfficiencyReport(modelName: string, totalTokens: number): string {
  const params = getModelParams(modelName);
  const impact = estimateLLMEmissions({
    modelParamsInBillion: params,
    totalTokens,
  });
  
  return `
Model: ${modelName} (${params}B parameters)
Total Tokens: ${totalTokens.toLocaleString()}
Energy Used: ${impact.energyUsageKWh.toFixed(3)} kWh
CO₂ Emissions: ${impact.co2EmissionsKg.toFixed(3)} kg
Energy Cost: $${impact.energyCostUsd.toFixed(2)}
Water Usage: ${impact.waterUsageGallons.toFixed(1)} gallons
Trees Needed: ${impact.co2EquivalentTreesNeeded.toFixed(1)} trees/year
`;
}
