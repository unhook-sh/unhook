#!/usr/bin/env node
import chalk from 'chalk';
import { execa } from 'execa';
import figures from 'figures';
import { Box, Text, render } from 'ink';
import Spinner from 'ink-spinner';
import meow from 'meow';
import React, { useEffect, useState } from 'react';
import { UsageTable } from './components/UsageTable.js';
import type { TokenUsageData } from './types/index.js';
import { parseCCUsageOutput } from './utils/parser.js';

const cli = meow(
  `
  Usage
    $ cctree

  Options
    --help       Show help
    --version    Show version
    --verbose    Show detailed comparisons

  Examples
    $ cctree
    $ cctree --verbose
`,
  {
    importMeta: import.meta,
    flags: {
      verbose: {
        type: 'boolean',
        default: false,
      },
    },
  },
);

interface AppProps {
  verbose: boolean;
}

const App: React.FC<AppProps> = ({ verbose }) => {
  const [data, setData] = useState<TokenUsageData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Execute ccusage command
        const { stdout } = await execa('ccusage', ['--latest']);

        // Parse the output
        const parsedData = parseCCUsageOutput(stdout);

        if (parsedData.length === 0) {
          setError('No data found in ccusage output');
        } else {
          setData(parsedData);
        }
      } catch (err) {
        if (err instanceof Error) {
          // Check if ccusage is not installed
          if (
            err.message.includes('command not found') ||
            err.message.includes('not found')
          ) {
            setError(
              'ccusage command not found. Please install it first: npm install -g ccusage',
            );
          } else {
            setError(`Error running ccusage: ${err.message}`);
          }
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box>
        <Text color="green">
          <Spinner type="dots" /> Fetching usage data...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Text color="red">
          {figures.cross} {error}
        </Text>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box>
        <Text color="yellow">{figures.warning} No data available</Text>
      </Box>
    );
  }

  return <UsageTable data={data} showComparisons={verbose} />;
};

// Render the app
const { clear } = render(<App verbose={cli.flags.verbose} />);

// Handle exit
process.on('exit', () => {
  clear();
});
