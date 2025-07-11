import type { TokenUsageData } from '../types/index.js';

/**
 * Parse ccusage output to extract token usage data
 */
export function parseCCUsageOutput(output: string): TokenUsageData[] {
  const lines = output.split('\n');
  const data: TokenUsageData[] = [];

  // Find the table data
  let inTable = false;
  let skipHeader = true;

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Look for table separator
    if (line.includes('─') && line.includes('│')) {
      inTable = true;
      continue;
    }

    // Skip until we're in the table
    if (!inTable) continue;

    // Skip the header row
    if (skipHeader && line.includes('Date')) {
      skipHeader = false;
      continue;
    }

    // Skip the Total row
    if (line.includes('Total')) break;

    // Parse data rows
    const parts = line
      .split('│')
      .map((p) => p.trim())
      .filter((p) => p);

    if (parts.length >= 8) {
      // Extract and clean numeric values
      const parseNumber = (str: string): number => {
        // Remove commas and any non-numeric characters except dots
        const cleaned = str.replace(/[^0-9.]/g, '');
        return parseFloat(cleaned) || 0;
      };

      const parseCost = (str: string): number => {
        // Remove $ and parse
        const cleaned = str.replace(/[$,]/g, '');
        return parseFloat(cleaned) || 0;
      };

      const row: TokenUsageData = {
        date: parts[0],
        models: parts[1],
        input: parseNumber(parts[2]),
        output: parseNumber(parts[3]),
        cacheCreate: parseNumber(parts[4]),
        cacheRead: parseNumber(parts[5]),
        totalTokens: parseNumber(parts[6]),
        cost: parseCost(parts[7]),
      };

      data.push(row);
    }
  }

  return data;
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}
