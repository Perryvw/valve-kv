import { arrayToKvObject, isKvObject, KVObject } from "./index";

export function serialize(kvobject: KVObject): string {
    const roots = [];
    for (const [key, value] of Object.entries(kvobject)) {
        if (isKvObject(value)) {
            roots.push(`"${key}"\n` + serializeIndented(value, 0));
        } else {
            roots.push(`"${key}"    ${value}`);
        }
    }
    return roots.join("\n\n");
}

function serializeIndented(kvobject: KVObject, indent = 0) {
    let result = [indentString(indent) + "{"];
    for (const [key, value] of Object.entries(kvobject)) {
        if (typeof value === "string" || typeof value === "number") {
            result.push(`${indentString(indent + 1)}"${key}"    "${value}"`);
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
