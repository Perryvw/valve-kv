import * as fs from "fs";

import { KVObject } from "./index";

export function deserialize(kvstring: string | Buffer, encoding: BufferEncoding = "utf8"): KVObject {
    const buffer = typeof kvstring === "string" ? Buffer.from(kvstring) : kvstring;
    const parser = new Parser(buffer, encoding);
    return parser.parse();
}

export function deserializeFile(filename: string, encoding: BufferEncoding = "utf8"): KVObject {
    const buffer = fs.readFileSync(filename);
    const parser = new Parser(buffer, encoding);
    return parser.parse();
}

export class DeserializationError extends Error {
    constructor(message: string, index: number) {
        super(`${message} At index: ${index}`);
    }
}

class Parser {

    private index = -1;
    private next = "";

    constructor (private buffer: Buffer, private encoding: BufferEncoding) { }

    public parse(): KVObject {
        this.step(); // Initial step to initialize this.next and this.index

        this.skipBOM(); // Try to skip BOM, no effect if not present
        
        this.skipWhitespace();

        const bases = this.parseBases(); // Parse #base includes

        this.skipWhitespace();

        const name = this.parseString(); // Assume all KV files are in format "name" { ... }
        this.skipWhitespace();
        const object = this.parseObject();

        return { [name]: object };
    }

    private parseBases(): KVObject[] {
        const bases = [];

        while (this.next === "#") {
            this.expectString("#base");

            this.skipWhitespace();

            const path = this.parseString();
            bases.push(deserializeFile(path));

            this.skipWhitespace();
        }

        return bases;
    }

    private parseObject(): KVObject {
        const obj: KVObject = {};
        
        this.expectChar("{");
        this.skipWhitespace();

        while (this.next !== "}") {

            const key = this.next === `"` ? this.parseString() : this.parseQuotelessString();

            this.skipWhitespace();

            const value = this.parseValue();
            obj[key] = value;

            this.skipWhitespace();

            // If value is followed by conditional (ie [WINDOWS]), ignore it
            // These conditionals are curently not included in the output
            if (this.next === "[") {
                this.ignoreConditional();
                this.skipWhitespace();
            }
        }

        this.expectChar("}");

        return obj;
    }

    private parseValue() {
        if (this.next === null) {
            throw new DeserializationError("Unexpected EOF (end-of-file).", this.index);
        } else if (this.next === "\"") {
            return this.parseString();
        } else if (this.next === "{") {
            return this.parseObject();
        } else if (this.next === "[") {
            return this.parseBracketString();
        } else if (!isWhitespace(this.next)) {
            return this.parseQuotelessString();
        } else {
            throw new DeserializationError(`Unexpected character '${this.next}'.`, this.index);
        }
    }

    private parseString(): string {
        this.expectChar(`"`);

        const start = this.index;
        while (this.next !== `"` || this.previous() === `\\`) {
            this.step();
        }

        const string = this.buffer.toString(this.encoding, start, this.index);

        this.expectChar(`"`);

        return string;
    }

     private parseBracketString() : string {
        this.expectChar("[");

        const start = this.index;

        while (this.next !== null && this.next !== "]") {
            this.step();
        }

        const str = this.buffer.toString(this.encoding, start, this.index);

        this.expectChar("]");

        return `[${str}]`;
    }

    private parseQuotelessString() : string {
        const start = this.index;

        while (this.next !== null && !isWhitespace(this.next)) {
            this.step();
        }

        return this.buffer.toString(this.encoding, start, this.index + 1);
    }

    /* Helpers */

    private previous(): string {
        return this.buffer.toString(this.encoding, this.index - 1, this.index);
    }

    // Get the next character, allows an expected value. If the next character does not
    // match the expected character throws an error.
    private expectChar(expectedChar: string): string {

        const current = this.next;

        if (current === undefined) {
            throw new DeserializationError("Unexpected EOF (end-of-file).", this.index);
        }

        if (expectedChar && current !== expectedChar) {
            throw new DeserializationError(`Unexpected character '${current}', expected '${expectedChar}'.`, this.index);
        }

        this.step();

        return current;
    }

    private expectString(expectedString: string): string {
        for (const c of expectedString) {
            this.expectChar(c);
        }

        return expectedString;
    }

    private step() {
        // Do not allow stepping from beyond the end of the stream
        if (this.index >= this.buffer.length) {
            throw new DeserializationError("Unexpected EOF (end-of-file).", this.index);
        }
        this.index++;

        if (this.index >= this.buffer.length) {
            this.next = "";
        } else {
            this.next = this.buffer.toString(this.encoding, this.index, this.index + 1);
        }           
    }

    private skipWhitespace() {
        // Ignore whitespace
        while (this.next === " " ||this.next === "\t" || this.next === "\r" || this.next === "\n") {
            this.step();
        }

        if (this.next === "/") {
            this.ignoreComment();
            this.skipWhitespace();
        }
    }

    private skipBOM() {
        const bom = new Set("\xef\xbb\xbf\xff\xfe\xfe\xff");
        while (bom.has(this.next) || this.next.charCodeAt(0) > 1000) {
            this.step();
        }
    }

    private ignoreConditional() : void {
        this.expectChar("[");

        while (this.next !== "]" && this.index < this.buffer.length) {
            this.step();
        }

        if (this.index >= this.buffer.length) {
            throw new DeserializationError("Missing ending ] for conditional.", this.index);
        }

        this.expectChar("]");
    }

    // Advance the read index until after the single line comment
    private ignoreComment() : void {
        this.step();

        while (this.next !== "\n") {
            this.step();
        }
    }
}

function isWhitespace(char: string): boolean {
    return char.trim().length === 0;
}