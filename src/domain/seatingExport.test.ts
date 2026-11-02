import { describe, expect, it } from "vitest";
import { seatingHtml } from "./seatingExport";
describe("seating PDF", () => {
  it("escapes guest and table content", () => {
    const output = seatingHtml(
      "A & B",
      [{ id: "t", name: "<VIP>", shape: "round", capacity: 10, x: 0, y: 0 }],
      [
        {
          id: "g",
          name: "Ali <script>",
          group: "",
          pax: 2,
          rsvp: "Hadir",
          tableId: "t",
        },
      ],
    );
    expect(output).toContain("A &amp; B");
    expect(output).toContain("&lt;VIP&gt;");
    expect(output).not.toContain("<script>");
  });
  it("lists unassigned guests", () =>
    expect(
      seatingHtml(
        "E",
        [],
        [{ id: "g", name: "Siti", group: "", pax: 1, rsvp: "Menunggu" }],
      ),
    ).toContain("Siti"));
});
