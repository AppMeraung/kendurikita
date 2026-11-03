import { describe, expect, it } from "vitest";
import { addNote, filterNotes, parseNotes, removeNote } from "./notes";

const at = new Date("2026-01-12T10:00:00Z");

describe("notes", () => {
  it("adds a trimmed note at the top", () => {
    const notes = addNote([], { title: "  Wedding ideas ", body: " Colours " }, at, "n1");
    expect(notes).toEqual([{ id: "n1", title: "Wedding ideas", body: "Colours", createdAt: at.toISOString() }]);
    expect(addNote(notes, { title: "Second", body: "" }, at, "n2")[0].id).toBe("n2");
  });
  it("rejects a note without a title", () => {
    expect(() => addNote([], { title: "   ", body: "x" }, at, "n1")).toThrow();
  });
  it("filters by title or body, case-insensitive", () => {
    const notes = [
      { id: "a", title: "Vendor meetings", body: "catering", createdAt: "" },
      { id: "b", title: "Things to buy", body: "Attire", createdAt: "" },
    ];
    expect(filterNotes(notes, "ATTIRE").map((n) => n.id)).toEqual(["b"]);
    expect(filterNotes(notes, "  ")).toHaveLength(2);
    expect(filterNotes(notes, "nothing")).toHaveLength(0);
  });
  it("removes by id", () => {
    expect(removeNote([{ id: "a", title: "x", body: "", createdAt: "" }], "a")).toEqual([]);
  });
  it("parses stored JSON safely", () => {
    expect(parseNotes(null)).toEqual([]);
    expect(parseNotes("not json")).toEqual([]);
    expect(parseNotes('{"a":1}')).toEqual([]);
    expect(parseNotes('[{"id":"a","title":"t","body":"b","createdAt":"c"},{"bad":true}]')).toHaveLength(1);
  });
});
