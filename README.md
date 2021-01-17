# Valve KV for Node
Node.js implementation of serialization and deserialization of Valve's KeyValues (KV or VDF) format.

This parser is based on [PHPValveKV](https://github.com/Perryvw/PHPValveKV).

## Installation
```
npm install valve-kv
```

## Example deserialize usage
Deserialize a string
```ts
import { deserialize } from "valve-kv";

const kv = `"A" 
            { 
                "B"  "C" 
            }`;
const kvObject = deserialize(kv);
const b = kvObject["A"]["B"]; // string "C"
```

Deserialize a file (supports `#base` includes):
```ts
import { deserializeFile } from "valve-kv";

const itemsFileObject = deserializeFile("items.txt");
// Default encoding is utf-8, but it can be specified
const utf16FileObject = deserializeFile("utf16File.txt", "utf16le");
```

## Example serialize usage
Serialize an object to KV:
```ts
import { serialize } from "valve-kv";

const myObj = { A: { B: "C" } };
const kv = serialize(myObj);
/* kv value:
"A"
{
    "B"    "C"
}
*/
```

Serialize arrays to KV:
```ts
import { serialize } from "valve-kv";

const myObj = { A: ["C", "D", "E"] };
const kv = serialize(myObj);
/* kv value:
"A"
{
    "1"    "C"
    "2"    "D"
    "3"    "E"
}
*/
```

## Available methods

### + deserialize(kvstring, [encoding = utf8])
Deserialize a string to a KVObject.

### + deserializeFile(filepath, [encoding = utf8])
Deserialize a file to a KVObject. This supports the usage of `#base` includes in the file.

### + serialize(kvobject)
Serialize an object to a KV string.

### + isKvObject(kvValue)
Check if a KVValue (could be object or basic value) is a KVObject.

### + arrayToKvObject(array)
Transform an array into a KV object. Example:
```ts
const kvobject = arrayToKvObject(["A", "B", "C"]);
// { ["1"]: "A", ["2"]: "B", ["3"]: "C" }
```

### + arrayFromKvObject(array)
Transform a KV object to an array. Example:
```ts
const kvobject = arrayFromKvObject({ ["1"]: "A", ["2"]: "B", ["3"]: "C" });
// ["A", "B", "C"]
```
