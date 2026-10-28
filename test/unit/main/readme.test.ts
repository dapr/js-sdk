/*
Copyright 2026 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import fs from "fs";
import path from "path";

// The README is copied into the published npm package, so it must read well on npmjs.com.
describe("README", () => {
  const readme = fs.readFileSync(path.join(__dirname, "../../../README.md"), "utf8");

  const linkTargets = (): string[] => {
    const targets: string[] = [];
    for (const match of readme.matchAll(/\]\(([^)\s]+)\)/g)) {
      targets.push(match[1]);
    }
    for (const match of readme.matchAll(/^\s*\[[^\]]+\]:\s*(\S+)/gm)) {
      targets.push(match[1]);
    }
    for (const match of readme.matchAll(/(?:href|src)="([^"]+)"/g)) {
      targets.push(match[1]);
    }
    return targets;
  };

  it("uses only absolute links", () => {
    const targets = linkTargets();
    expect(targets.length).toBeGreaterThan(0);
    const relative = targets.filter((target) => !/^https?:\/\//.test(target));
    expect(relative).toEqual([]);
  });

  it("gives every code fence a language", () => {
    const openingFences = readme
      .split("\n")
      .filter((line) => line.trim().startsWith("```"))
      .filter((_, index) => index % 2 === 0);
    expect(openingFences.length).toBeGreaterThan(0);
    for (const fence of openingFences) {
      expect(fence.trim()).toMatch(/^```\S+/);
    }
  });

  it("opens with a sentence describing the SDK before Getting Started", () => {
    const intro = readme.slice(0, readme.indexOf("## Getting Started"));
    expect(intro).toContain("Dapr SDK for JavaScript and TypeScript");
    expect(intro).toMatch(/durable workflows, actors, pub\/sub, state, jobs/);
  });

  it("has a Workflows section linking the examples, the overview and the JS SDK docs", () => {
    const start = readme.indexOf("\n## Workflows\n");
    expect(start).toBeGreaterThan(-1);
    const end = readme.indexOf("\n## ", start + 1);
    const section = readme.slice(start, end === -1 ? undefined : end);
    expect(section).toContain("https://github.com/dapr/js-sdk/tree/main/examples/workflow");
    expect(section).toContain(
      "https://docs.dapr.io/developing-applications/building-blocks/workflow/workflow-overview/",
    );
    expect(section).toContain("https://docs.dapr.io/developing-applications/sdks/js/");
  });

  it("links only to files that exist in this repository when pointing at dapr/js-sdk main", () => {
    const prefix = /^https:\/\/github\.com\/dapr\/js-sdk\/(?:blob|tree)\/main\/(.+)$/;
    for (const target of linkTargets()) {
      const match = target.match(prefix);
      if (match) {
        const repoPath = match[1].split("#")[0];
        expect(fs.existsSync(path.join(__dirname, "../../..", repoPath))).toBe(true);
      }
    }
  });

  it("does not give Search its own heading", () => {
    expect(readme).not.toMatch(/^#+\s*Search\s*$/m);
  });
});
