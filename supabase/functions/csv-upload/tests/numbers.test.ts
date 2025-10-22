import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseNumericFromCell } from "../lib/numbers.ts";

Deno.test("parseNumericFromCell extracts first numeric token", () => {
  assertEquals(parseNumericFromCell(" <10 CFU/L "), 10);
  assertEquals(parseNumericFromCell(">= 0.25 mg/L"), 0.25);
  assertEquals(parseNumericFromCell("-12.5 something"), -12.5);
  assertEquals(parseNumericFromCell("1.23e3 units"), 1230);
});

Deno.test("parseNumericFromCell returns null for non-numeric", () => {
  assertEquals(parseNumericFromCell("ND"), null);
  assertEquals(parseNumericFromCell(""), null);
  assertEquals(parseNumericFromCell("  --  "), null);
  assertEquals(parseNumericFromCell(undefined), null);
});
