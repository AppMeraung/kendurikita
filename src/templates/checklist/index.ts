import { ChecklistItem } from "../../domain";
import aqiqah from "./aqiqah.json";
import birthday from "./birthday.json";
import chineseWedding from "./chinese-wedding.json";
import corporate from "./corporate.json";
import engagement from "./engagement.json";
import indianWedding from "./indian-wedding.json";
import indonesianWedding from "./indonesian-wedding.json";
import malayWedding from "./kahwin-melayu.json";
import master from "./master.json";

type Group = "12m" | "9m" | "6m" | "3m" | "1m" | "day" | "after";
type TemplateTask = {
  title?: string;
  key?: string;
  group: Group;
  muslim?: boolean;
};
const offsets: Record<Group, number> = {
  "12m": -365,
  "9m": -270,
  "6m": -180,
  "3m": -90,
  "1m": -30,
  day: 0,
  after: 7,
};
type MasterItem = {
  n: number;
  group: Group;
  events: string;
  minGuests?: number;
  vendor?: string;
  same?: string[];
} & Record<"ms" | "en" | "zh" | "ta" | "id", string>;
export const masterChecklist = master as MasterItem[];
const groupOrder: Group[] = ["12m", "9m", "6m", "3m", "1m", "day", "after"];
const templates: Record<
  string,
  { prefix: string; tasks: TemplateTask[]; code: string; earliest: Group }
> = {
  "Chinese wedding": {
    prefix: "zh-wedding",
    tasks: chineseWedding as TemplateTask[], code: "W", earliest: "12m",
  },
  "Indian wedding": {
    prefix: "in-wedding",
    tasks: indianWedding as TemplateTask[], code: "W", earliest: "12m",
  },
  "Indonesian wedding": {
    prefix: "id-wedding",
    tasks: indonesianWedding as TemplateTask[], code: "W", earliest: "12m",
  },
  Pertunangan: { prefix: "engagement", tasks: engagement as TemplateTask[], code: "E", earliest: "6m" },
  Aqiqah: { prefix: "aqiqah", tasks: aqiqah as TemplateTask[], code: "A", earliest: "3m" },
  "Majlis Hari Jadi": { prefix: "birthday", tasks: birthday as TemplateTask[], code: "B", earliest: "3m" },
  "Majlis Korporat": {
    prefix: "corporate",
    tasks: corporate as TemplateTask[], code: "C", earliest: "6m",
  },
  "Majlis Akad Nikah": { prefix: "nikah", tasks: [], code: "N", earliest: "6m" },
  "Kenduri Doa Selamat": { prefix: "kenduri", tasks: [], code: "K", earliest: "3m" },
  Reunion: { prefix: "reunion", tasks: [], code: "R", earliest: "3m" },
  "Festival / Acara Awam": { prefix: "festival", tasks: [], code: "F", earliest: "12m" },
};

function build(
  tasks: TemplateTask[],
  eventDate: string | null,
  prefix: string,
  translate: (key: string) => string,
): ChecklistItem[] {
  return tasks.map((task, index) => {
    const date = eventDate ? new Date(`${eventDate}T12:00:00`) : null;
    if (date) date.setDate(date.getDate() + offsets[task.group]);
    return {
      id: `template-${prefix}-${index + 1}`,
      title: task.key ? translate(task.key) : task.title || "",
      due:
        date && !Number.isNaN(date.getTime())
          ? date.toISOString().slice(0, 10)
          : task.group,
      done: false,
      priority:
        index < Math.ceil(tasks.length * 0.3)
          ? "Tinggi"
          : index < Math.ceil(tasks.length * 0.7)
            ? "Sederhana"
            : "Rendah",
    };
  });
}

export function createMalayWeddingChecklist(
  eventDate: string | null,
): ChecklistItem[] {
  return build(malayWedding as TemplateTask[], eventDate, "ms", (key) => key);
}
export function createChecklistForEvent(
  type: string,
  eventDate: string | null,
  translate: (key: string) => string = (key) => key,
  { lang = "ms", guests = 0 }: { lang?: string; guests?: number } = {},
) {
  if (type === "Kenduri Kahwin Melayu")
    return createMalayWeddingChecklist(eventDate);
  const template = templates[type];
  if (!template) return [];
  const keys = new Set(template.tasks.map((task) => task.key));
  const earliest = groupOrder.indexOf(template.earliest);
  const extra = masterChecklist.filter(
    (item) =>
      (item.events === "*" || item.events.includes(template.code)) &&
      !item.same?.some((key) => keys.has(key)) &&
      guests >= (item.minGuests ?? 0),
  );
  const tasks = [
    ...template.tasks.map((task, index) => ({ task, id: `template-${template.prefix}-${index + 1}` })),
    ...extra.map((item) => ({
      task: {
        title: item[lang as "ms"] ?? item.en,
        group: groupOrder[Math.max(earliest, groupOrder.indexOf(item.group))],
      },
      id: `master-${item.n}`,
    })),
  ];
  // Template tasks keep their original ids; the list is ordered by lead time.
  const sorted = tasks
    .map((entry, index) => ({ ...entry, index }))
    .sort(
      (a, b) =>
        groupOrder.indexOf(a.task.group) - groupOrder.indexOf(b.task.group) ||
        a.index - b.index,
    );
  return build(sorted.map((entry) => entry.task), eventDate, template.prefix, translate).map(
    (item, index) => ({ ...item, id: sorted[index].id }),
  );
}
