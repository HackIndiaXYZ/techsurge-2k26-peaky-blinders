import type {
  ScenarioMessage,
} from "@/data/scenarios";

interface MessageBubbleProps {
  message: ScenarioMessage;
}

export function MessageBubble({
  message,
}: MessageBubbleProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-xl">
        <div className="mb-2 text-xs text-zinc-600">
          {message.timestamp
            ? new Intl.DateTimeFormat("en-IN", {
                hour: "numeric",
                minute: "2-digit",
              }).format(new Date(message.timestamp))
            : "10:42 AM"}
        </div>

        <div className="rounded-2xl rounded-tl-md border border-zinc-800 bg-zinc-900 px-5 py-4">
          <p className="text-[15px] leading-7 text-zinc-200">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}
