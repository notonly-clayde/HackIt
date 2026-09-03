import type { SampleTestCase } from "../../types/api"
import { isStructuredValue, jsLiteral, parseTestValue, pythonJsonLiteral } from "./runner/parseTestValue"

export type PlayLanguage = "python" | "javascript" | "cpp"

export function inferExportName(starterCode: string | null | undefined, language: PlayLanguage): string {
  if (!starterCode) return "solve"

  if (language === "javascript") {
    const patterns = [
      /export\s+(?:async\s+)?function\s+(\w+)/,
      /export\s+const\s+(\w+)\s*=/,
      /function\s+(\w+)\s*\(/,
      /const\s+(\w+)\s*=\s*(?:async\s*)?\(/,
    ]
    for (const pattern of patterns) {
      const match = starterCode.match(pattern)
      if (match?.[1] && match[1] !== "test") return match[1]
    }
  }

  if (language === "python") {
    const match = starterCode.match(/^def\s+(\w+)\s*\(/m)
    if (match?.[1]) return match[1]
  }

  if (language === "cpp") {
    const patterns = [
      /(?:std::)?string\s+(\w+)\s*\(/,
      /(?:auto|int|void|bool)\s+(\w+)\s*\(/,
    ]
    for (const pattern of patterns) {
      const match = starterCode.match(pattern)
      if (match?.[1] && match[1] !== "main") return match[1]
    }
  }

  return "solve"
}

function jsMatcher(expected: unknown): "toBe" | "toEqual" {
  if (
    isStructuredValue(expected) ||
    typeof expected === "number" ||
    typeof expected === "boolean" ||
    expected === null
  ) {
    return "toEqual"
  }
  return "toBe"
}

function buildJavaScriptHarness(sampleTests: SampleTestCase[], exportName: string): string {
  const cases =
    sampleTests.length === 0
      ? `  it('example case', () => {
    // expect(${exportName}(parseInput('[1,2,3]'))).toEqual([1, 2, 3]);
  });`
      : sampleTests
          .map((test, index) => {
            const parsedInput = parseTestValue(test.input)
            const parsedExpected = parseTestValue(test.expectedOutput)
            const matcher = jsMatcher(parsedExpected)
            return `  it('case ${index + 1}', () => {
    expect(${exportName}(${jsLiteral(parsedInput)})).${matcher}(${jsLiteral(parsedExpected)});
  });`
          })
          .join("\n\n")

  return `import { describe, it, expect, parseInput } from '@hackit/test-runtime';

// Define ${exportName}(input) in the solution editor.
// Valid JSON inputs like [1,2,3] are auto-parsed into arrays/objects.
describe('sample tests', () => {
${cases}
});
`
}

function pythonValueExpr(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return JSON.stringify(raw)

  try {
    JSON.parse(trimmed)
    return `json.loads(${pythonJsonLiteral(raw)})`
  } catch {
    return JSON.stringify(raw)
  }
}

function buildPythonHarness(sampleTests: SampleTestCase[], exportName: string): string {
  const cases =
    sampleTests.length === 0
      ? `# def test_example():
#     assert ${exportName}(json.loads("[1,2,3]")) == json.loads("[1,2,3]")`
      : sampleTests
          .map(
            (test, index) => `def test_case_${index + 1}():
    assert ${exportName}(${pythonValueExpr(test.input)}) == ${pythonValueExpr(test.expectedOutput)}`,
          )
          .join("\n\n")

  return `# pytest-style sample tests — Run executes on the server.
# Define ${exportName}(input) in the solution editor.
# Valid JSON inputs like [1,2,3] are auto-parsed into arrays/objects.
import json

${cases}
`
}

function escapeForCppString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
}

function buildCppHarness(sampleTests: SampleTestCase[], exportName: string): string {
  const cases =
    sampleTests.length === 0
      ? `// TEST(SampleTests, Example) {
//   EXPECT_EQ(${exportName}("input"), "expected");
// }`
      : sampleTests
          .map(
            (test, index) => `TEST(SampleTests, Case${index + 1}) {
  EXPECT_EQ(${exportName}("${escapeForCppString(test.input)}"), "${escapeForCppString(test.expectedOutput)}");
}`,
          )
          .join("\n\n")

  return `// Google Test-style sample tests — Run executes on the server.
// Structured JSON parsing is available in JavaScript and Python first.
// Implement std::string ${exportName}(const std::string& input) in the solution editor.

#include <string>

${cases}
`
}

export function buildTestHarness(
  language: PlayLanguage,
  sampleTests: SampleTestCase[],
  starterCode?: string | null,
): string {
  const exportName = inferExportName(starterCode, language)

  switch (language) {
    case "javascript":
      return buildJavaScriptHarness(sampleTests, exportName)
    case "python":
      return buildPythonHarness(sampleTests, exportName)
    case "cpp":
      return buildCppHarness(sampleTests, exportName)
    default:
      return buildJavaScriptHarness(sampleTests, exportName)
  }
}

export function testHarnessKey(problemId: string, language: PlayLanguage): string {
  return `${problemId}:${language}`
}
