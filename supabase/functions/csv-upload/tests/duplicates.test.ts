import { assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { checkForDuplicatesInUpload } from "../services/duplicates.ts";
import { MockRepo } from "./mock_repo.ts";
import type { Repo } from "../repo/types.ts";

function ciHeaderMap(headers: string[]) {
  return new Map(headers.map((h) => [h.toLowerCase(), h]));
}

Deno.test("duplicates: no duplicates (within CSV or DB) passes", async () => {
  const headers = [
    "Client",
    "SiteName",
    "Date",
    "TimeSample",
    "FeedType",
    "FlushType",
    "FloorLevel",
    "Area",
    "Location",
    "OutletType",
  ];
  const headerMap = ciHeaderMap(headers);

  const rows = [
    {
      Client: "Acme Hospital",
      SiteName: "Ward A",
      Date: "29-Jan-25",
      TimeSample: "06:03:00",
      FeedType: "Cold",
      FlushType: "Pre",
      FloorLevel: "",
      Area: "",
      Location: "Tap 1",
      OutletType: "Basin",
    },
    {
      Client: "Acme Hospital",
      SiteName: "Ward A",
      Date: "29-Jan-25",
      TimeSample: "07:10:00",
      FeedType: "Cold",
      FlushType: "Pre",
      FloorLevel: "",
      Area: "",
      Location: "Tap 2",
      OutletType: "Basin",
    },
  ];

  // No site / no finalized rows injected -> nothing to clash
  const repo: Repo = new MockRepo({}, { siteId: null, finalized: [] });
  const mappings = await repo.loadMappings();

  await checkForDuplicatesInUpload(rows, headerMap, repo, mappings); // should NOT throw
});

Deno.test(
  "duplicates: duplicate within CSV (same row twice) throws with row numbers",
  async () => {
    const headers = [
      "Client",
      "SiteName",
      "Date",
      "TimeSample",
      "FeedType",
      "FlushType",
      "FloorLevel",
      "Area",
      "Location",
      "OutletType",
    ];
    const headerMap = ciHeaderMap(headers);

    // Row 2 and row 3 are identical
    const rows = [
      {
        Client: "Acme Hospital",
        SiteName: "Ward A",
        Date: "29-Jan-25",
        TimeSample: "06:03:00",
        FeedType: "Cold",
        FlushType: "Pre",
        FloorLevel: "",
        Area: "",
        Location: "Tap 1",
        OutletType: "Basin",
      },
      {
        Client: "Acme Hospital",
        SiteName: "Ward A",
        Date: "29-Jan-25",
        TimeSample: "06:03:00",
        FeedType: "Cold",
        FlushType: "Pre",
        FloorLevel: "",
        Area: "",
        Location: "Tap 1",
        OutletType: "Basin",
      },
    ];

    const repo: Repo = new MockRepo({}, { siteId: "site-1", finalized: [] });
    const mappings = await repo.loadMappings();

    await assertRejects(
      () => checkForDuplicatesInUpload(rows, headerMap, repo, mappings),
      Error,
      "Duplicate rows found within this CSV"
    );
  }
);

Deno.test(
  "duplicates: duplicate against DB finalized readings throws with row numbers",
  async () => {
    const headers = [
      "Client",
      "SiteName",
      "Date",
      "TimeSample",
      "FeedType",
      "FlushType",
      "FloorLevel",
      "Area",
      "Location",
      "OutletType",
    ];
    const headerMap = ciHeaderMap(headers);

    const rows = [
      {
        Client: "Acme Hospital",
        SiteName: "Ward A",
        Date: "29-Jan-25",
        TimeSample: "06:03:00",
        FeedType: "Cold",
        FlushType: "Pre",
        FloorLevel: "",
        Area: "",
        Location: "Tap 1",
        OutletType: "Basin",
      },
    ];

    // Simulate a finalized DB row that exactly matches the CSV row
    const finalized = [
      {
        time_utc: "2025-01-29 06:03:00",
        floor_norm: "",
        area_norm: "",
        location_norm: "tap 1",
        outlet_norm: "basin",
        feed_type_id: "feed-cold-id",
        flush_type_id: "flush-pre-id",
      },
    ];

    const repo: Repo = new MockRepo({}, { siteId: "site-1", finalized });
    const mappings = await repo.loadMappings();

    await assertRejects(
      () => checkForDuplicatesInUpload(rows, headerMap, repo, mappings),
      Error,
      "Rows duplicate existing finalized readings"
    );
  }
);

Deno.test(
  'duplicates: missing "TimeSample" in a row throws a specific error',
  async () => {
    const headers = [
      "Client",
      "SiteName",
      "Date",
      "TimeSample",
      "FeedType",
      "FlushType",
      "FloorLevel",
      "Area",
      "Location",
      "OutletType",
    ];
    const headerMap = ciHeaderMap(headers);

    const rows = [
      {
        Client: "Acme Hospital",
        SiteName: "Ward A",
        Date: "29-Jan-25",
        TimeSample: "", // <-- missing
        FeedType: "Cold",
        FlushType: "Pre",
        FloorLevel: "",
        Area: "",
        Location: "Tap 1",
        OutletType: "Basin",
      },
    ];

    const repo: Repo = new MockRepo({}, { siteId: "site-1", finalized: [] });
    const mappings = await repo.loadMappings();

    await assertRejects(
      () => checkForDuplicatesInUpload(rows, headerMap, repo, mappings),
      Error,
      'Row 2: "TimeSample" is required'
    );
  }
);
