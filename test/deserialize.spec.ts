import * as fs from "fs";
import * as path from "path";
import * as test from "tape";

import { deserialize, KVObject } from "../src/index";

const testDeserialize = (kvstring: string, expected: KVObject) => (t: test.Test) => {
    const result = deserialize(kvstring);
    t.deepEqual(result, expected);
    t.end();
};

test("deserialize string", testDeserialize(
    `"A" { "B" "C" }`,
    {
        A: {
            B: "C"
        }
    }
));

test("deserialize multiline-string", testDeserialize(
    `"A" { "B" "C
    D
    E
    F" }`,
    {
        A: {
            B: `C
    D
    E
    F`
        }
    }
));

test("deserialize string with escaped quote", testDeserialize(
    `"A" { "B"  "C\\"D" }`,
    {
        A: {
            B: `C\\"D`
        }
    }
));

test("deserialize array", testDeserialize(
    `"A" { "B" {
        "1"    "C"
        "2"    "D"
    } }`,
    {
        A: {
            B: { ["1"]: "C", ["2"]: "D" }
        }
    }
));

test("deserialize buffer", t => {
    const filename = path.join(__dirname, "testcases", "test.kv");
    const result = deserialize(fs.readFileSync(filename));
    t.deepEqual(result, { A: { B: "C" }});
    t.end();
});
