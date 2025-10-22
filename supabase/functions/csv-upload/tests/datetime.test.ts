import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { toIsoDateFromDDMonYY, normalizeTimeHHMMSS } from "../lib/datetime.ts";

Deno.test("toIsoDateFromDDMonYY parses 29-Jan-25 -> 2025-01-29", () => {
  assertEquals(toIsoDateFromDDMonYY("29-Jan-25", 2), "2025-01-29");
  assertEquals(toIsoDateFromDDMonYY("7-Feb-25", 2), "2025-02-07");
});

Deno.test(
  "normalizeTimeHHMMSS normalizes 6:03 -> 06:03:00, 06:03:00 stays",
  () => {
    assertEquals(normalizeTimeHHMMSS("6:03", 2), "06:03:00");
    assertEquals(normalizeTimeHHMMSS("06:03:00", 2), "06:03:00");
  }
);
