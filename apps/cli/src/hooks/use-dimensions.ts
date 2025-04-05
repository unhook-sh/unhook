import { useStdout } from 'ink';
import { useEffect, useState } from 'react';

export function useDimensions(): { columns: number; rows: number } {
  const { stdout } = useStdout();
  const [dimensions, setDimensions] = useState<{
    columns: number;
    rows: number;
  }>({
    columns: stdout.columns,
    rows: stdout.rows,
  });

  useEffect(() => {
    const handler = () =>
      setDimensions({
        columns: stdout.columns,
        rows: stdout.rows,
      });
    stdout.on('resize', handler);
    return () => {
      stdout.off('resize', handler);
    };
  }, [stdout]);

  return dimensions;
}
