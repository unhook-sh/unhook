import chalk from 'chalk';
import { Box, Text } from 'ink';
import React from 'react';
import type { ExtendedUsageData, TokenUsageData } from '../types/index.js';
import {
  calculateEnvironmentalImpact,
  formatEnvironmentalMetrics,
} from '../utils/environmental.js';
import { formatNumber } from '../utils/parser.js';

interface UsageTableProps {
  data: TokenUsageData[];
  showComparisons?: boolean;
}

export const UsageTable: React.FC<UsageTableProps> = ({
  data,
  showComparisons = false,
}) => {
  // Calculate environmental impact for each row
  const extendedData: ExtendedUsageData[] = data.map((row) => ({
    ...row,
    environmental: calculateEnvironmentalImpact(row),
  }));

  // Calculate totals
  const totals = extendedData.reduce(
    (acc, row) => ({
      input: acc.input + row.input,
      output: acc.output + row.output,
      cacheCreate: acc.cacheCreate + row.cacheCreate,
      cacheRead: acc.cacheRead + row.cacheRead,
      totalTokens: acc.totalTokens + row.totalTokens,
      cost: acc.cost + row.cost,
      energyUsageKWh: acc.energyUsageKWh + row.environmental.energyUsageKWh,
      co2EmissionsKg: acc.co2EmissionsKg + row.environmental.co2EmissionsKg,
      co2EquivalentTreesNeeded:
        acc.co2EquivalentTreesNeeded +
        row.environmental.co2EquivalentTreesNeeded,
      waterUsageGallons:
        acc.waterUsageGallons + row.environmental.waterUsageGallons,
    }),
    {
      input: 0,
      output: 0,
      cacheCreate: 0,
      cacheRead: 0,
      totalTokens: 0,
      cost: 0,
      energyUsageKWh: 0,
      co2EmissionsKg: 0,
      co2EquivalentTreesNeeded: 0,
      waterUsageGallons: 0,
    },
  );

  // Column widths
  const cols = {
    date: 10,
    models: 15,
    input: 10,
    output: 10,
    cache: 10,
    total: 12,
    cost: 10,
    energy: 12,
    co2: 12,
    trees: 10,
    water: 10,
  };

  const separator = '─';
  const corner = '┼';
  const vertical = '│';

  // Create separator line
  const createSeparator = () => {
    const parts = [
      separator.repeat(cols.date),
      separator.repeat(cols.models),
      separator.repeat(cols.input),
      separator.repeat(cols.output),
      separator.repeat(cols.cache),
      separator.repeat(cols.cache),
      separator.repeat(cols.total),
      separator.repeat(cols.cost),
      separator.repeat(cols.energy),
      separator.repeat(cols.co2),
      separator.repeat(cols.trees),
      separator.repeat(cols.water),
    ];
    return parts.join(corner);
  };

  return (
    <Box flexDirection="column">
      {/* Title */}
      <Box
        marginBottom={1}
        borderStyle="round"
        borderColor="green"
        paddingX={2}
      >
        <Text color="green" bold>
          Claude Code Token Usage & Environmental Impact Report - Daily
        </Text>
      </Box>

      {/* Header */}
      <Box>
        <Text>
          {vertical}
          {chalk.cyan('Date'.padEnd(cols.date))}
          {vertical}
          {chalk.cyan('Models'.padEnd(cols.models))}
          {vertical}
          {chalk.cyan('Input'.padEnd(cols.input))}
          {vertical}
          {chalk.cyan('Output'.padEnd(cols.output))}
          {vertical}
          {chalk.cyan('Cache Cr.'.padEnd(cols.cache))}
          {vertical}
          {chalk.cyan('Cache Rd.'.padEnd(cols.cache))}
          {vertical}
          {chalk.cyan('Total Tok.'.padEnd(cols.total))}
          {vertical}
          {chalk.cyan('Cost'.padEnd(cols.cost))}
          {vertical}
          {chalk.green('Energy'.padEnd(cols.energy))}
          {vertical}
          {chalk.green('CO₂'.padEnd(cols.co2))}
          {vertical}
          {chalk.green('Trees'.padEnd(cols.trees))}
          {vertical}
          {chalk.green('Water'.padEnd(cols.water))}
          {vertical}
        </Text>
      </Box>

      {/* Separator */}
      <Box>
        <Text>{createSeparator()}</Text>
      </Box>

      {/* Data rows */}
      {extendedData.map((row) => {
        const envMetrics = formatEnvironmentalMetrics(row.environmental);
        return (
          <Box key={`${row.date}-${row.models}`}>
            <Text>
              {vertical}
              {row.date.padEnd(cols.date)}
              {vertical}
              {row.models.padEnd(cols.models)}
              {vertical}
              {formatNumber(row.input).padStart(cols.input)}
              {vertical}
              {formatNumber(row.output).padStart(cols.output)}
              {vertical}
              {formatNumber(row.cacheCreate).padStart(cols.cache)}
              {vertical}
              {formatNumber(row.cacheRead).padStart(cols.cache)}
              {vertical}
              {formatNumber(row.totalTokens).padStart(cols.total)}
              {vertical}
              {`$${row.cost.toFixed(2)}`.padStart(cols.cost)}
              {vertical}
              {chalk.yellow(envMetrics.energy.padStart(cols.energy))}
              {vertical}
              {chalk.red(envMetrics.co2.padStart(cols.co2))}
              {vertical}
              {chalk.green(envMetrics.trees.padStart(cols.trees))}
              {vertical}
              {chalk.blue(envMetrics.water.padStart(cols.water))}
              {vertical}
            </Text>
          </Box>
        );
      })}

      {/* Separator before totals */}
      <Box>
        <Text>{createSeparator()}</Text>
      </Box>

      {/* Totals row */}
      <Box>
        <Text bold>
          {vertical}
          {chalk.bold('Total'.padEnd(cols.date))}
          {vertical}
          {''.padEnd(cols.models)}
          {vertical}
          {chalk.bold(formatNumber(totals.input).padStart(cols.input))}
          {vertical}
          {chalk.bold(formatNumber(totals.output).padStart(cols.output))}
          {vertical}
          {chalk.bold(formatNumber(totals.cacheCreate).padStart(cols.cache))}
          {vertical}
          {chalk.bold(formatNumber(totals.cacheRead).padStart(cols.cache))}
          {vertical}
          {chalk.bold(formatNumber(totals.totalTokens).padStart(cols.total))}
          {vertical}
          {chalk.bold(`$${totals.cost.toFixed(2)}`.padStart(cols.cost))}
          {vertical}
          {chalk.yellow.bold(
            `${totals.energyUsageKWh.toFixed(3)} kWh`.padStart(cols.energy),
          )}
          {vertical}
          {chalk.red.bold(
            `${totals.co2EmissionsKg.toFixed(3)} kg`.padStart(cols.co2),
          )}
          {vertical}
          {chalk.green.bold(
            `${totals.co2EquivalentTreesNeeded.toFixed(1)} trees`.padStart(
              cols.trees,
            ),
          )}
          {vertical}
          {chalk.blue.bold(
            `${totals.waterUsageGallons.toFixed(1)} gal`.padStart(cols.water),
          )}
          {vertical}
        </Text>
      </Box>

      {/* Environmental impact summary */}
      <Box marginTop={1} flexDirection="column">
        <Text color="yellow" bold>
          Environmental Impact Summary:
        </Text>
        <Text color="gray">
          • Energy consumption equivalent to{' '}
          {Math.round(totals.energyUsageKWh / 0.012)} smartphone charges
        </Text>
        <Text color="gray">
          • CO₂ emissions equivalent to driving{' '}
          {Math.round(totals.co2EmissionsKg / 0.404)} miles
        </Text>
        <Text color="gray">
          • Water usage equivalent to{' '}
          {Math.round(totals.waterUsageGallons / 17)} showers
        </Text>
        <Text color="gray">
          • Would require {totals.co2EquivalentTreesNeeded.toFixed(1)} trees
          growing for a year to offset CO₂
        </Text>
      </Box>
    </Box>
  );
};
