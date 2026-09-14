import fs from "node:fs";
import path from "node:path";

export function getReadme(): string {
  return fs.readFileSync(path.join(process.cwd(), "README.md"), "utf-8");
}

export function getAssessment02(): string {
  return fs.readFileSync(path.join(process.cwd(), "ASSESSMENT_02.md"), "utf-8");
}
