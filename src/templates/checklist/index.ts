import { ChecklistItem } from "../../domain";
import aqiqah from "./aqiqah.json";
import birthday from "./birthday.json";
import chineseWedding from "./chinese-wedding.json";
import corporate from "./corporate.json";
import engagement from "./engagement.json";
import indianWedding from "./indian-wedding.json";
import indonesianWedding from "./indonesian-wedding.json";
import malayWedding from "./kahwin-melayu.json";

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
const templates: Record<string, { prefix: string; tasks: TemplateTask[] }> = {
  "Chinese wedding": {
    prefix: "zh-wedding",
    tasks: chineseWedding as TemplateTask[],
  },
  "Indian wedding": {
    prefix: "in-wedding",
    tasks: indianWedding as TemplateTask[],
  },
  "Indonesian wedding": {
    prefix: "id-wedding",
    tasks: indonesianWedding as TemplateTask[],
  },
  Pertunangan: { prefix: "engagement", tasks: engagement as TemplateTask[] },
  Aqiqah: { prefix: "aqiqah", tasks: aqiqah as TemplateTask[] },
  "Majlis Hari Jadi": { prefix: "birthday", tasks: birthday as TemplateTask[] },
  "Majlis Korporat": {
    prefix: "corporate",
    tasks: corporate as TemplateTask[],
  },
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
) {
  if (type === "Kenduri Kahwin Melayu")
    return createMalayWeddingChecklist(eventDate);
  const template = templates[type];
  return template
    ? build(template.tasks, eventDate, template.prefix, translate)
    : [];
}
