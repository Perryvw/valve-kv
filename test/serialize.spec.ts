import * as test from "tape";

import { serialize, KVObject } from "../src/index";

const testSerialize = (kvobject: KVObject, expected: string) => (t: test.Test) => {
    const result = serialize(kvobject);
    t.equal(result, expected);
    t.end();
};

test(
    "serialize string",
    testSerialize(
        { A: { B: "C" } },
        `"A"
{
    "B"    "C"
}`
    )
);

test(
    "serialize number",
    testSerialize(
        { A: { B: 5 } },
        `"A"
{
    "B"    "5"
}`
    )
);

test(
    "serialize array",
    testSerialize(
        { A: { B: ["C", "D"] } },
        `"A"
{
    "B"
    {
        "1"    "C"
        "2"    "D"
    }
}`
    )
);

test(
    "serialize nested",
    testSerialize(
        { A: { B: { C: "D" }, E: "F" } },
        `"A"
{
    "B"
    {
        "C"    "D"
    }
    "E"    "F"
}`
    )
);

test(
    "multiple roots",
    testSerialize(
        { A: { B: 1 }, C: { D: 2 } },
        `"A"
{
    "B"    "1"
}

"C"
{
    "D"    "2"
}`
    )
);
