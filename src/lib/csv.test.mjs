// Run: node src/lib/csv.test.mjs
import assert from "node:assert/strict";
import { parseCSV, csvRowToJob } from "./csv.js";

const rows = parseCSV('\uFEFFJob Name,Client,Contract Value,Estimated Cost,Start Date\r\n"Smith, Deck",Smith,"$12,500",9000,2026-03-01\r\nBad row,,abc,1\r\n\r\n"Say ""hi""",X,1,1,\n');
assert.equal(rows.length, 3);
assert.equal(rows[0].job_name, "Smith, Deck");
assert.equal(rows[2].job_name, 'Say "hi"');
assert.deepEqual(csvRowToJob(rows[0]), { job_name: "Smith, Deck", client_name: "Smith", contract_value: 12500, estimated_cost: 9000, status: "active", start_date: "2026-03-01" });
assert.equal(csvRowToJob(rows[1]), null);
assert.deepEqual(parseCSV(""), []);
console.log("csv ok");
