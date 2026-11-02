import type { EventData } from "../state/AppState";

export function widgetSnapshot(event: EventData | null, now = new Date()) {
  const eventTime = event?.date
    ? new Date(`${event.date}T00:00:00`).getTime()
    : Number.NaN;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return {
    eventName: event?.name || "KenduriKita",
    daysLeft: Number.isFinite(eventTime)
      ? Math.max(0, Math.ceil((eventTime - start.getTime()) / 86_400_000))
      : 0,
    nextTask: event?.checklist.find((item) => !item.done)?.title || "",
  };
}
