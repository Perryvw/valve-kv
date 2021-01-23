import { arrayToKvObject, isDuplicateKeyArray, isKvObject, KVObject, KVValue } from "./index";

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

function serializeIndented(kvobject: KVObject, indent = 0): string {
    let result = [indentString(indent) + "{"];
    for (const [key, value] of Object.entries(kvobject)) {
        result.push(serializeKeyValue(key, value, indent));
    }

    result.push(indentString(indent) + "}");
    return result.join("\n");
}

function serializeKeyValue(key: string, value: KVValue, indent = 0): string {
    if (typeof value === "string"){
        return `${indentString(indent + 1)}"${key}"    "${escape(value)}"`;
    } else if (typeof value === "number") {
        return `${indentString(indent + 1)}"${key}"    "${value}"`;
    } else if (Array.isArray(value)) {
        if (isDuplicateKeyArray(value)) {
            return value.map(v => serializeKeyValue(key, v, indent)).join("\n");
        } else {
            return `${indentString(indent + 1)}"${key}"\n`
                + serializeIndented(arrayToKvObject(value), indent + 1);
        }
    } else {
        return `${indentString(indent + 1)}"${key}"\n`
            + serializeIndented(value, indent + 1);
    }
}

function escape(unescaped: string): string {
    return unescaped
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
}

const indentString = (count: number) => "    ".repeat(count);
