'use client';

export function RequestTimeline() {
  return (
    <div className="relative h-12 border-b">
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <div className="text-xs text-muted-foreground">Apr 02</div>
        <div className="text-xs text-muted-foreground">Apr 03</div>
      </div>
      <div className="absolute inset-y-0 left-1/4 w-px bg-border" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
      <div className="absolute inset-y-0 left-3/4 w-px bg-border" />

      <div className="absolute inset-y-0 left-[70%] w-1 bg-muted" />
      <div className="absolute inset-y-0 left-[80%] w-1 bg-muted" />
    </div>
  );
}
