import {
  ENVIRONMENTAL_CONSTANTS,
  type EnvironmentalImpact,
  type TokenUsageData,
} from '../types/index.js';

/**
 * Calculate environmental impact based on token usage
 */
export function calculateEnvironmentalImpact(
  usage: TokenUsageData,
): EnvironmentalImpact {
  // Get model efficiency multiplier
  const modelName =
    usage.models.split(',')[0]?.trim().toLowerCase() || 'sonnet-4';
  const efficiency = ENVIRONMENTAL_CONSTANTS.MODEL_EFFICIENCY[modelName] || 1.0;

  // Calculate total tokens in millions
  const millionTokens = usage.totalTokens / 1_000_000;

  // Calculate energy usage with model efficiency
  const energyUsageKWh =
    millionTokens * ENVIRONMENTAL_CONSTANTS.KWH_PER_MILLION_TOKENS * efficiency;

  // Calculate CO2 emissions
  const co2EmissionsKg =
    energyUsageKWh * ENVIRONMENTAL_CONSTANTS.CO2_KG_PER_KWH;

  // Calculate equivalent trees needed (yearly absorption)
  const co2EquivalentTreesNeeded =
    co2EmissionsKg / ENVIRONMENTAL_CONSTANTS.TREE_CO2_ABSORPTION_KG_PER_YEAR;

  // Calculate water usage
  const waterUsageGallons =
    energyUsageKWh * ENVIRONMENTAL_CONSTANTS.GALLONS_WATER_PER_KWH;

  return {
    energyUsageKWh: parseFloat(energyUsageKWh.toFixed(4)),
    co2EmissionsKg: parseFloat(co2EmissionsKg.toFixed(4)),
    co2EquivalentTreesNeeded: parseFloat(co2EquivalentTreesNeeded.toFixed(2)),
    waterUsageGallons: parseFloat(waterUsageGallons.toFixed(2)),
  };
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
export function getEnvironmentalComparisons(
  impact: EnvironmentalImpact,
): string[] {
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
