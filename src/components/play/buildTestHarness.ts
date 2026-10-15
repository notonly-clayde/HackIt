import type { SampleTestCase } from "../../types/api"
import { isStructuredValue, jsLiteral, parseTestValue, pythonLiteral, toSolveArgs } from "./runner/parseTestValue"

export type PlayLanguage = "python" | "javascript"

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
            const args = toSolveArgs(test.input).map(jsLiteral).join(", ")
            const parsedExpected = parseTestValue(test.expectedOutput)
            const matcher = jsMatcher(parsedExpected)
            return `  it('case ${index + 1}', () => {
    expect(${exportName}(${args})).${matcher}(${jsLiteral(parsedExpected)});
  });`
          })
          .join("\n\n")

  return `import { describe, it, expect, parseInput } from '@hackit/test-runtime';

// Define ${exportName} in the solution editor; each test passes the sample arguments in order.
describe('sample tests', () => {
${cases}
});
`
}

function buildPythonHarness(sampleTests: SampleTestCase[], exportName: string): string {
  const cases =
    sampleTests.length === 0
      ? `# def test_example():
#     assert ${exportName}([1, 2, 3]) == [1, 2, 3]`
      : sampleTests
          .map((test, index) => {
            const args = toSolveArgs(test.input).map(pythonLiteral).join(", ")
            const expected = pythonLiteral(parseTestValue(test.expectedOutput))
            return `def test_case_${index + 1}():
    assert ${exportName}(${args}) == ${expected}`
          })
          .join("\n\n")

  return `# pytest-style sample tests — Run executes on the server.
# Define ${exportName} in the solution editor; each test passes the sample arguments in order.

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
    default:
      return buildJavaScriptHarness(sampleTests, exportName)
  }
}

export function testHarnessKey(problemId: string, language: PlayLanguage): string {
  return `${problemId}:${language}`
}
