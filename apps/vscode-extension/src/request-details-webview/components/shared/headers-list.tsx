interface HeadersListProps {
  headers: Record<string, string> | undefined | null;
  labelWidthClass?: string;
  textSizeClass?: string;
}

export function HeadersList({
  headers,
  labelWidthClass = 'w-40',
  textSizeClass = 'text-sm',
}: HeadersListProps) {
  if (!headers || Object.keys(headers).length === 0) return null;
  return (
    <div className="space-y-2">
      {Object.entries(headers).map(([key, value]) => (
        <div className={`flex font-mono ${textSizeClass}`} key={key}>
          <span className={`text-primary ${labelWidthClass} flex-shrink-0`}>
            {key}:
          </span>
          <span className="text-foreground break-all">{value}</span>
        </div>
      ))}
    </div>
  );
}
