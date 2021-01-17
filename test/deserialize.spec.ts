import * as path from "path";
import * as test from "tape";
import { performance } from "perf_hooks";

import { deserialize, deserializeFile, KVObject } from "../src/index";

const testDeserialize = (kvstring: string, expected: KVObject) => (t: test.Test) => {
    const result = deserialize(kvstring);
    t.deepEqual(result, expected);
    t.end();
};

test(
    "deserialize string",
    testDeserialize(`"A" { "B" "C" }`, {
        A: {
            B: "C",
        },
    })
);

test(
    "deserialize multiline-string",
    testDeserialize(
        `"A" { "B" "C
    D
    E
    F" }`,
        {
            A: {
                B: `C
    D
    E
    F`,
            },
        }
    )
);

test(
    "deserialize string with escaped quote",
    testDeserialize(`"A" { "B"  "C\\"D" }`, {
        A: {
            B: `C\\"D`,
        },
    })
);

test(
    "deserialize array",
    testDeserialize(
        `"A" { "B" {
        "1"    "C"
        "2"    "D"
    } }`,
        {
            A: {
                B: {
                    "1": "C",
                    "2": "D",
                },
            },
        }
    )
);

const testFilePath = (fileName: string) => path.join(__dirname, "testcases", fileName);

test("deserialize buffer", (t) => {
    const filename = testFilePath("basic.kv");
    const result = deserializeFile(filename);
    t.deepEqual(result, { A: { B: "C" } });
    t.end();
});

test("deserialize with BOM", (t) => {
    const filename = testFilePath("basic-BOM.kv");
    const result = deserializeFile(filename);
    t.deepEqual(result, { A: { B: "C" } });
    t.end();
});

test("deserialize with utf16le", (t) => {
    const filename = testFilePath("basic-utf16le.kv");
    const result = deserializeFile(filename, "utf16le");
    t.deepEqual(result, { A: { B: "C" } });
    t.end();
});

testDeserializeFile("basic.kv", { A: { B: "C" } });
testDeserializeFile("basic2.kv", { A: { B: "C", D: "E" } });
testDeserializeFile("nested.kv", { A: { B: { C: { D: {} } } } });
testDeserializeFile("comments.kv", { A: { B: { C: { D: "value" } } } });
testDeserializeFile("commentsMultiLine.kv", {
    A: { B: { COMMENT: "/*OR NOT*/" } },
});
testDeserializeFile("commenteof.kv", {});
testDeserializeFile("stringescapes.kv", {
    Test: { A: '3\\"5', B: "A\\\\", C: "\\\\" },
});
testDeserializeFile("quoteless.kv", {
    TestDocument: {
        QuotedChild: 'edge\\ncase\\"haha\\\\"',
        UnquotedChild: { Key1: "Value1", Key2: "Value2", Key3: "Value3" },
    },
});
testDeserializeFile("quotelessBracket.kv", {
    TestDocument: {
        $envmaptint: "[ .4 .4 .4]",
        $envmapsaturation: "[.5 .5 .5]",
    },
});
testDeserializeFile("quotelessSpecial.kv", {
    TestDocument: {
        $QuotedChild: 'edge\\ncase\\"haha\\\\"',
        "#UnquotedChild": {
            "&Key1": "$Value1",
            "!Key2": "@Value2",
            "%Key3": "Value3",
        },
    },
});
testDeserializeFile("conditional.kv", {
    "test case": {
        "operating system": ["windows 32-bit", "something else"],
        platform: "windows",
        "ui type": ["Widescreen Xbox 360", "Xbox 360"],
        "ui size": ["small", "medium", "large"],
    },
});
testDeserializeFile("base.kv", {
    root: { rootProp: "A", included1: "B", included2: { C: "D" } },
});
testDeserializeFile("multipleroots.kv", {
    root1: { A: "B" },
    root2: { C: "D" },
});
testDeserializeFile("duplicatekeys.kv", {
    root: { key1: ["2", { key2: ["5", "6"] }, { key3: "4" }] },
});
testDeserializeFile("duplicaterootkeys.kv", {
    root: [
        { key1: "2", key2: "4" },
        { key1: "3", key2: "5" },
    ],
});

function testDeserializeFile(fileName: string, expected: KVObject) {
    test(`deserializeFile (${fileName})`, (t) => {
        const path = testFilePath(fileName);
        const kvobject = deserializeFile(path);

        t.deepEquals(kvobject, expected);
        t.end();
    });
}

testCanParse("vkv/comment_singleline.vdf");
testCanParse("vkv/comment_singleline_wholeline.vdf");
testCanParse("vkv/comment_singleline_singleslash.vdf");
testCanParse("vkv/comment_singleline_singleslash_wholeline.vdf");
testCanParse("vkv/conditional.vdf");
testCanParse("vkv/conditional_in_key.vdf");
testCanParse("vkv/duplicate_keys.vdf");
testCanParse("vkv/duplicate_keys_object.vdf");
testCanParse("vkv/empty.vdf");
testCanParse("vkv/escaped_backslash.vdf");
testCanParse("vkv/escaped_backslash_not_special.vdf");
testCanParse("vkv/escaped_garbage.vdf");
testCanParse("vkv/escaped_quotation_marks.vdf");
testCanParse("vkv/escaped_whitespace.vdf");
testCanParse("vkv/invalid_conditional.vdf"); // No conditional validation
testCanParse("vkv/kv_base_included.vdf");
testCanParse("vkv/kv_included.vdf");
testCanParse("vkv/kv_with_base.vdf");
testCanParse("vkv/legacydepotdata_subset.vdf");
testCanParse("vkv/list_of_values.vdf");
testCanParse("vkv/list_of_values_empty_key.vdf");
testCanParse("vkv/list_of_values_skipping_keys.vdf");
testCanParse("vkv/nested_object_graph.vdf");
testCanParse("vkv/object_person.vdf");
testCanParse("vkv/object_person_attributes.vdf");
testCanParse("vkv/object_person_mixed_case.vdf");
testCanParse("vkv/serialization_expected.vdf");
testCanParse("vkv/steam_440.vdf");
testCanParse("vkv/top_level_list_of_values.vdf");
testCanParse("vkv/type_guessing.vdf");
testCanParse("vkv/unquoted_document.vdf");

function testCanParse(fileName: string) {
    test(`can deserialize (${fileName})`, (t) => {
        const path = testFilePath(fileName);
        const kvobject = deserializeFile(path);
        t.end();
    });
}

benchmark("benchmark/dota_english.txt");
benchmark("benchmark/items.txt");
benchmark("benchmark/npc_units.txt");
benchmark("benchmark/weapon_ak47.txt");

function benchmark(fileName: string) {
    test(`can deserialize (${fileName})`, (t) => {
        const path = testFilePath(fileName);

        const start = performance.now();

        const kvobject = deserializeFile(path);
        
        const duration = performance.now() - start;

        console.log(`Deserializing ${fileName} took ${duration}ms.`);

        t.end();
    });
}
