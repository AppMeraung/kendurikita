import { ChecklistItem } from "../domain";

const weights: Record<ChecklistItem["priority"], number> = {
  Tinggi: 0,
  Sederhana: 1,
  Rendah: 2,
};
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function checklistReminderDate(due: string, hour = 9) {
  if (!validDate(due)) return null;
  const date = new Date(`${due}T${String(hour).padStart(2, "0")}:00:00`);
  return date.getTime() > Date.now() ? date : null;
}
export function sortChecklist(
  items: ChecklistItem[],
  mode: "due" | "priority" | "assignee",
) {
  return [...items].sort((a, b) =>
    mode === "priority"
      ? weights[a.priority] - weights[b.priority] || a.due.localeCompare(b.due)
      : mode === "assignee"
        ? (a.assignedTo || "zzzz").localeCompare(b.assignedTo || "zzzz")
        : a.due.localeCompare(b.due),
  );
}
