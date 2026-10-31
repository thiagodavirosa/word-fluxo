import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("manifesto", () => {
  it("aponta para o task pane em localhost:3000", () => {
    const xml = readFileSync(new URL("../manifest.xml", import.meta.url), "utf8");
    expect(xml).toContain("https://localhost:3000/taskpane.html");
    expect(xml).toContain('<Host Name="Document"/>');
  });
});
