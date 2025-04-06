import { useStdout } from 'ink';
import { useEffect, useState } from 'react';

export function useDimensions(): { width: number; height: number } {
  const { stdout } = useStdout();
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: stdout.columns,
    height: stdout.rows,
  });

  useEffect(() => {
    const handler = () =>
      setDimensions({
        width: stdout.columns,
        height: stdout.rows,
      });
    stdout.on('resize', handler);
    return () => {
      stdout.off('resize', handler);
    };
  }, [stdout]);

  return dimensions;
}
