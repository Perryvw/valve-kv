export type KVObject = { [key: string]: KVValue };
export type KVValue = KVObject | string | number | Array<KVValue>;

export { serialize } from "./serialize";
export { deserialize } from "./deserialize";

export function isKvObject(value: KVValue): value is KVObject {
    return typeof value !== "string";
}

export function arrayToKvObject<T extends KVValue>(array: T[]): KVObject {
    const obj: KVObject = {};

    for (let i = 0; i < array.length; i++) {
        obj[(i + 1).toString()] = array[i];
    }

    return obj;
}

export function arrayFromKvObject(kvobject: KVObject): KVValue[] {
    const result = [];
    let index = 1;
    let indexString;
    while (kvobject[indexString = index.toString()]) {
        result.push(kvobject[indexString]);
    }

    return result;
}