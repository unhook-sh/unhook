import { useStdout } from 'ink';
import { useEffect, useState } from 'react';

export function useDimensions(): { width: number; height: number } {
  const { stdout } = useStdout();
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({
    height: stdout.rows,
    width: stdout.columns,
  });

  useEffect(() => {
    const handler = () =>
      setDimensions({
        height: stdout.rows,
        width: stdout.columns,
      });
    stdout.on('resize', handler);
    return () => {
      stdout.off('resize', handler);
    };
  }, [stdout]);

  return dimensions;
}
