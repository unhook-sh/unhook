'use client';
import { Button } from '@unhook/ui/components/button';

export function CloseWindowButton() {
  return (
    <Button onClick={() => window.close()} autoFocus>
      Close
    </Button>
  );
}
