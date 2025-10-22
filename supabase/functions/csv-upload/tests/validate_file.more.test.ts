import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateFile } from "../services/validate_file.ts";

// Minimal FakeRepo that mirrors your lowercase mapping behavior
class MockRepo {
  async loadMappings() {
    return {
      // Legionella -> (legionellaresult, temperature)
      // TVC E Coli and Coliform -> (tvc37result, tvc22result, ecoliresult, coliformresult, temperature)
      parameterResultMap: new Map<string, string[]>([
        ["p_legionella", ["r_legionella", "r_temp"]],
        [
          "p_tvc_combo",
          ["r_tvc37", "r_tvc22", "r_ecoli", "r_coliform", "r_temp"],
        ],
      ]),
      resultTypeIdToFieldName: new Map<string, string>([
        ["r_temp", "temperature"],
        ["r_legionella", "legionellaresult"],
        ["r_tvc37", "tvc37result"],
        ["r_tvc22", "tvc22result"],
        ["r_ecoli", "ecoliresult"],
        ["r_coliform", "coliformresult"],
      ]),
      // NOTE: keys must be lowercase to match validate_file.ts
      paramNameToId: new Map<string, string>([
        ["legionella", "p_legionella"],
        ["tvc e coli and coliform", "p_tvc_combo"],
      ]),
      // These maps aren’t used by validateFile but required by the type
      clientNameToId: new Map<string, string>(),
      feedNameToId: new Map<string, string>(),
      flushNameToId: new Map<string, string>(),
    };
  }
}

// Helper to build a multipart/form-data Request with a CSV body
function makeRequest(csv: string, name = "file.csv", type = "text/csv") {
  const fd = new FormData();
  fd.append("file", new File([csv], name, { type }));
  return new Request("http://localhost/upload", { method: "POST", body: fd });
}

Deno.test(
  "validateFile passes with multiple parameters and mixed-case result headers",
  async () => {
    // Parameters include Legionella + TVC combo; headers are mixed case to test case-insensitive matching
    const CSV = `Client,SiteName,Parameters,Date,TimeSample,FeedType,FlushType,Temperature,TvC37ReSuLt,TVC22RESULT,EcoliResult,ColiformResult,LeGionellaResUlT
ACME,Main,"Legionella, TVC E Coli and Coliform",29-Jan-25,06:03:00,cold,pre,21.5,120,140,0,0,10
`;

    const req = makeRequest(CSV);
    const csvText = await validateFile(req, new MockRepo() as any);
    assertEquals(csvText.csvText.trim(), CSV.trim());
  }
);

Deno.test(
  "validateFile fails when a required result header is missing (newline-separated parameters)",
  async () => {
    // Missing EColiResult on purpose
    const CSV = `Client,SiteName,Parameters,Date,TimeSample,FeedType,FlushType,Temperature,TVC37Result,TVC22Result,ColiformResult,LegionellaResult
ACME,Main,"Legionella
TVC E Coli and Coliform",29-Jan-25,06:03:00,cold,pre,20.1,10,20,0,5
`;

    const req = makeRequest(CSV);
    try {
      await validateFile(req, new MockRepo() as any);
      throw new Error("Function did not throw");
    } catch (e: any) {
      if (e.message === "Function did not throw") throw e;
      // validateFile throws a JSON-stringified Zod issues array
      const issues = JSON.parse(e.message);
      // Expect at least one issue referencing the missing header
      const msgs = issues.map((i: any) => i.message);
      assert(
        msgs.some(
          (m: string) =>
            m.includes('Missing required result header "ecoliresult"') ||
            m.includes('Missing required result header "EColiResult"')
        ),
        `Expected an error mentioning missing "EColiResult". Got: ${msgs.join(
          " | "
        )}`
      );
    }
  }
);

Deno.test("validateFile ignores extra/unexpected headers", async () => {
  const CSV = `Client,SiteName,Parameters,Date,TimeSample,FeedType,FlushType,Temperature,TVC37Result,TVC22Result,EColiResult,ColiformResult,LegionellaResult,ExtraCol
ACME,Main,"Legionella, TVC E Coli and Coliform",29-Jan-25,06:03:00,cold,pre,19,1,2,0,0,12,hello
`;
  const req = makeRequest(CSV);
  const text = await validateFile(req, new MockRepo() as any);
  assertEquals(text.csvText.trim(), CSV.trim());
});
