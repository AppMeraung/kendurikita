import { describe, expect, it } from "vitest";
import { inventoryProgress } from "../domain";

describe("inventory progress", () => {
  it("calculates progress from completed quantities", () => {
    expect(
      inventoryProgress([
        {
          id: "1",
          name: "Bag",
          category: "goodie_bag",
          target: 100,
          completed: 40,
          status: "ordered",
        },
        {
          id: "2",
          name: "Gift",
          category: "door_gift",
          target: 50,
          completed: 50,
          status: "ready",
        },
      ]),
    ).toEqual({ target: 150, completed: 90, percent: 60 });
  });
  it("does not count excess completed units above the target", () => {
    expect(
      inventoryProgress([
        {
          id: "1",
          name: "A",
          category: "other",
          target: 5,
          completed: 8,
          status: "ready",
        },
      ]).completed,
    ).toBe(5);
  });
});
