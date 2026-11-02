/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

function tsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = join(directory, entry.name);
    return entry.isDirectory() ? tsxFiles(target) : entry.name.endsWith(".tsx") ? [target] : [];
  });
}

describe("touch accessibility", () => {
  it("gives every custom Pressable an accessibility label", () => {
    const missing: string[] = [];
    for (const file of tsxFiles("src")) {
      const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node) => {
        if (ts.isJsxOpeningElement(node) && node.tagName.getText(source) === "Pressable") {
          const attributes = node.attributes.properties.filter(ts.isJsxAttribute).map((attribute) => attribute.name.getText(source));
          if (!attributes.includes("accessibilityLabel")) {
            const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
            missing.push(`${file}:${line}`);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect(missing).toEqual([]);
  });
});
