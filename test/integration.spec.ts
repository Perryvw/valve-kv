import * as fs from "fs";
import * as path from "path";
import * as test from "tape";

import { deserialize, serialize } from "../src/index";

function deserializeSerializeTest(filename: string) {
    test("integration " + filename, (t) => {
        const fileContent = fs.readFileSync(path.join(__dirname, "testcases", filename)).toString();
        const kvObject = deserialize(fileContent);
        const serializedKv = serialize(kvObject);

        t.equal(serializedKv, fileContent.replace(/\r\n/g, "\n"));
        t.end();
    });
}

deserializeSerializeTest("basic.kv");
deserializeSerializeTest("multipleroots.kv");
