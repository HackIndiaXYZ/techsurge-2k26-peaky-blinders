interface ContextAttachedProps {
  compact?: boolean;
}

export function ContextAttached({
  compact = false,
}: ContextAttachedProps) {
  return (
    <div
      className={
        compact
          ? "flex items-center gap-2 text-xs text-zinc-500"
          : "rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
      }
    >
      <span className={compact ? "h-2 w-2 rounded-full bg-zinc-400" : "h-2 w-2 rounded-full bg-zinc-300 inline-block align-middle mr-2"} />

      <span className={compact ? "" : "text-sm text-zinc-300 inline-block align-middle"}>
        Context attached
      </span>
      {!compact && (
        <p className="mt-1 text-xs text-zinc-600 block">
          Payment review can use the conversation context.
        </p>
      )}
    </div>
  );
}
