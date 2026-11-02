import { TimelineItem } from "../domain";

export const validTime = (value: string) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export function validTimelineRange(start: string, end: string) {
  return validTime(start) && validTime(end) && start < end;
}
export function sortTimeline(items: TimelineItem[]) {
  return [...items].sort((a, b) =>
    `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`),
  );
}
export function overlappingTimeline(
  items: TimelineItem[],
  candidate: Omit<TimelineItem, "id">,
  ignoredId?: string,
) {
  return items.some(
    (item) =>
      item.id !== ignoredId &&
      item.date === candidate.date &&
      candidate.start < item.end &&
      candidate.end > item.start,
  );
}
