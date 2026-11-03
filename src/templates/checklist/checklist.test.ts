import { describe, expect, it } from "vitest";
import {
  createChecklistForEvent,
  createMalayWeddingChecklist,
  masterChecklist,
} from ".";

describe("Malay wedding checklist template", () => {
  it("contains exactly 100 editable suggestions", () => {
    const tasks = createMalayWeddingChecklist(null);
    expect(tasks).toHaveLength(100);
    expect(new Set(tasks.map((task) => task.id)).size).toBe(100);
    expect(tasks.every((task) => !task.done)).toBe(true);
  });

  it("calculates due dates relative to the event date", () => {
    const tasks = createMalayWeddingChecklist("2027-12-31");
    expect(tasks[85].due).toBe("2027-12-31");
    expect(tasks[95].due).toBe("2028-01-07");
  });
});

describe("cultural event templates", () => {
  const types = [
    "Chinese wedding",
    "Indian wedding",
    "Indonesian wedding",
    "Pertunangan",
    "Aqiqah",
    "Majlis Hari Jadi",
    "Majlis Korporat",
  ];
  it.each(types)("%s has its own translated, dated suggestions", (type) => {
    const tasks = createChecklistForEvent(
      type,
      "2028-12-31",
      (key) => `translated:${key}`,
    );
    expect(tasks.length).toBeGreaterThanOrEqual(10);
    const own = tasks.filter((task) => task.id.startsWith("template-"));
    expect(own.length).toBeGreaterThanOrEqual(10);
    expect(own.every((task) => task.title.startsWith("translated:"))).toBe(
      true,
    );
    expect(tasks.every((task) => /^\d{4}-\d{2}-\d{2}$/.test(task.due))).toBe(
      true,
    );
    expect(new Set(tasks.map((task) => task.id)).size).toBe(tasks.length);
  });
  it("returns no unrelated template for an unknown type", () =>
    expect(createChecklistForEvent("Unknown", null)).toEqual([]));
});

describe("master checklist", () => {
  const byId = (tasks: { id: string }[]) => new Set(tasks.map((task) => task.id));
  // Mirrors the 38 vendor category keys in kendurikita-portal/categories.js.
  const vendorKeys = "catering kuih cake nasi_beriani kambing_golek food_truck ice_cream drinks doorgift hamper bunga_telur invitation_gifts hantaran venue homestay equipment decor florist attire traditional_wear makeup hairstylist accessories henna photo_video dj emcee live_band kompang karaoke photobooth entertainment cultural transport planner audio_lighting nikah other_service".split(" ");

  it("has 200 numbered items in all five languages", () => {
    expect(masterChecklist.map((item) => item.n)).toEqual(
      Array.from({ length: 200 }, (_, index) => index + 1),
    );
    for (const item of masterChecklist)
      for (const lang of ["ms", "en", "zh", "ta", "id"] as const)
        expect(item[lang], `${item.n} ${lang}`).toBeTruthy();
  });

  it("only links known vendor categories", () => {
    expect(vendorKeys).toHaveLength(38);
    for (const item of masterChecklist)
      if (item.vendor) expect(vendorKeys, `${item.n}`).toContain(item.vendor);
  });

  it("keeps nikah items out of a birthday", () => {
    const ids = byId(createChecklistForEvent("Majlis Hari Jadi", null, undefined, { guests: 1000 }));
    for (const n of [99, 100, 101, 102]) expect(ids.has(`master-${n}`)).toBe(false);
    expect(ids.has("master-61")).toBe(false); // covered by templateBirthdayCake
    expect(ids.has("master-82")).toBe(true);
  });

  it("adds large-event items only when the guest count needs them", () => {
    const at = (guests: number) =>
      byId(createChecklistForEvent("Kenduri Doa Selamat", null, undefined, { guests }));
    expect(at(0).has("master-141")).toBe(false);
    expect(at(299).has("master-141")).toBe(false);
    expect(at(300).has("master-141")).toBe(true);
  });

  it("uses the chosen language and falls back to English", () => {
    const [zh] = createChecklistForEvent("Reunion", null, undefined, { lang: "zh" });
    const [fr] = createChecklistForEvent("Reunion", null, undefined, { lang: "fr" });
    expect(zh.title).toBe(masterChecklist.find((item) => `master-${item.n}` === zh.id)?.zh);
    expect(fr.title).toBe(masterChecklist.find((item) => `master-${item.n}` === fr.id)?.en);
  });

  it.each(["Majlis Akad Nikah", "Kenduri Doa Selamat", "Reunion", "Festival / Acara Awam"])(
    "%s gets a dated, ordered list with unique ids",
    (type) => {
      const tasks = createChecklistForEvent(type, "2028-12-31");
      expect(tasks.length).toBeGreaterThan(30);
      expect(byId(tasks).size).toBe(tasks.length);
      const dates = tasks.map((task) => task.due);
      expect([...dates].sort()).toEqual(dates);
    },
  );

  it("short-lead events never start more than three months out", () => {
    const tasks = createChecklistForEvent("Aqiqah", "2028-12-31");
    expect(tasks.every((task) => task.due >= "2028-10-02")).toBe(true);
  });

  it("does not repeat what a template already covers", () => {
    const tasks = createChecklistForEvent("Chinese wedding", null);
    const ids = byId(tasks);
    expect(ids.has("master-31")).toBe(false); // templateGuestList
    expect(ids.has("master-15")).toBe(false); // templateBookBanquet
    expect(ids.has("template-zh-wedding-1")).toBe(true);
  });
});
