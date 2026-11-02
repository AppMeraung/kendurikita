import { TimelineItem } from "../domain";

function timestamp(item: TimelineItem, end = false) {
  return new Date(`${item.date}T${end ? item.end : item.start}:00`).getTime();
}

export function liveTimeline(items: TimelineItem[], now = new Date()) {
  const sorted = [...items].sort((a, b) => timestamp(a) - timestamp(b));
  const value = now.getTime();
  const current = sorted.find(
    (item) => timestamp(item) <= value && timestamp(item, true) >= value,
  );
  const next = sorted.find((item) => timestamp(item) > value);
  return { current, next };
}
