import { describe, expect, it } from "vitest";
import { checklistCategory } from "./checklistCategory";
import malayWedding from "../templates/checklist/kahwin-melayu.json";

describe("checklistCategory", () => {
  it("uses the master section for master items", () => {
    expect(checklistCategory({ id: "master-44", title: "x" })).toBe("food");
    expect(checklistCategory({ id: "master-86", title: "x" })).toBe("attire");
    expect(checklistCategory({ id: "master-153", title: "x" })).toBe("transport");
    expect(checklistCategory({ id: "master-200", title: "x" })).toBe("after");
  });
  it("reads keywords in Malay and English titles", () => {
    expect(checklistCategory({ id: "a", title: "Tempah katering nasi minyak" })).toBe("food");
    expect(checklistCategory({ id: "b", title: "Book the bridal car" })).toBe("transport");
    expect(checklistCategory({ id: "c", title: "Tempah baju pengantin" })).toBe("attire");
    expect(checklistCategory({ id: "d", title: "Sediakan dulang hantaran" })).toBe("ceremony");
  });
  it("falls back to other for unknown wording", () => expect(checklistCategory({ id: "z", title: "Xyz" })).toBe("other"));
  it("places most Malay wedding template tasks in a real group", () => {
    const other = (malayWedding as { title: string }[]).filter((task, i) => checklistCategory({ id: `ms-${i}`, title: task.title }) === "other");
    expect(other.length).toBeLessThan(20);
  });
});
