import { arrayToKvObject, isKvObject, KVObject } from "./index";

export function serialize(kvobject: KVObject): string {
    const keys = Object.keys(kvobject);
    if (keys.length !== 1) {
        throw new Error("The outer KV object must have exactly one name")
    }

    const value = kvobject[keys[0]];
    if (isKvObject(value)) {
        return `"${keys[0]}"\n` + serializeIndented(value, 0);
    } else {
        return  `"${keys[0]}"    ${value}`;
    }
}

function serializeIndented(kvobject: KVObject, indent = 0) {

    let result = [indentString(indent) + "{"];
    for (const [key, value] of Object.entries(kvobject)) {
        if (typeof value === "string" || typeof value === "number") {
            result.push(`${indentString(indent + 1)}"${key}"    "${value}"`)
        } else if (Array.isArray(value)) {
            result.push(`${indentString(indent + 1)}"${key}"`);
            result.push(serializeIndented(arrayToKvObject(value), indent + 1));
        } else {
            result.push(`${indentString(indent + 1)}"${key}"`);
            result.push(serializeIndented(value, indent + 1));
        }
    }

    result.push(indentString(indent) + "}");
    return result.join("\n");
}

const indentString = (count: number) => "    ".repeat(count);