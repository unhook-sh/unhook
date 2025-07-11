# cctree - Claude Carbon Tree 🌳

A CLI tool that extends [ccusage](https://github.com/ccusage/ccusage) output with environmental impact metrics, showing the carbon footprint of your Claude API usage.

## Features

- 🌍 **Environmental Impact Metrics**: See energy usage, CO2 emissions, water consumption, and tree offset requirements
- 📊 **Beautiful Tables**: Enhanced visualization of token usage with environmental data
- 🎯 **Real-world Comparisons**: Understand impact through relatable comparisons (smartphone charges, miles driven, showers)
- 🚀 **Fast & Lightweight**: Built with React Ink for smooth terminal UI

## Installation

```bash
# First, make sure you have ccusage installed
npm install -g ccusage

# Then install cctree
npm install -g @unhook/cctree
```

## Usage

```bash
# Basic usage - shows token usage with environmental impact
cctree

# Verbose mode - includes detailed comparisons
cctree --verbose
```

## Environmental Calculations

The environmental impact is calculated based on:

- **Energy Usage**: ~0.294 kWh per million tokens (varies by model)
- **CO2 Emissions**: Based on US average of 0.475 kg CO2/kWh
- **Water Usage**: ~0.49 gallons per kWh for data center cooling
- **Tree Offset**: ~21.77 kg CO2 absorbed per tree per year

Model efficiency multipliers:
- Opus-4: 1.5x (larger model, more energy intensive)
- Sonnet-4: 1.0x (baseline)
- Haiku-4: 0.7x (smaller model, more efficient)

## Example Output

```
┌─────────────────────────────────────────────────────────────────┐
│  Claude Code Token Usage & Environmental Impact Report - Daily  │
└─────────────────────────────────────────────────────────────────┘

│Date      │Models         │Input     │Output    │...│Energy      │CO₂         │Trees     │Water     │
├──────────┼───────────────┼──────────┼──────────┼...┼────────────┼────────────┼──────────┼──────────┤
│2025-06-17│opus-4,sonnet-4│   37,168 │   78,068 │...│  0.048 kWh │  0.023 kg  │ 0.0 trees│  0.0 gal │
├──────────┼───────────────┼──────────┼──────────┼...┼────────────┼────────────┼──────────┼──────────┤
│Total     │               │   76,368 │  304,715 │...│  0.167 kWh │  0.079 kg  │ 0.0 trees│  0.1 gal │

Environmental Impact Summary:
• Energy consumption equivalent to 14 smartphone charges
• CO₂ emissions equivalent to driving 0 miles
• Water usage equivalent to 0 showers
• Would require 0.0 trees growing for a year to offset CO₂
```

## Development

```bash
# Clone the repository
git clone https://github.com/unhook-sh/unhook.git
cd unhook/apps/cctree

# Install dependencies
bun install

# Run in development mode
bun run dev

# Build
bun run build
```

## License

MIT © Unhook Team