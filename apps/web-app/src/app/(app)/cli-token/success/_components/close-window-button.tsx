'use client';
import { Button } from '@unhook/ui/components/button';

export function CloseWindowButton() {
  return (
    <Button autoFocus onClick={() => window.close()}>
      Close
    </Button>
  );
}
