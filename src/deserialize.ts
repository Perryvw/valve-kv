import { KVObject } from "./index";

const ENCODING = "utf8";

export function deserialize(kvstring: string | Buffer): KVObject {
    const buffer = typeof kvstring === "string" ? Buffer.from(kvstring) : kvstring;
    const parser = new Parser(buffer);
    return parser.parse();
}

export function deserializeFile(filename: string): KVObject {
    return {};
}

export class DeserializationError extends Error {
    constructor(message: string, index: number) {
        super(`${message} At index: ${index}`);
    }
}

class Parser {

    private index = -1;
    private next = "";

    constructor (private buffer: Buffer) { }

    public parse(): KVObject {
        this.step(); // Initial step
        this.skipWhitespace();

        const bases = this.parseBases();

        this.skipWhitespace();

        const name = this.parseString();

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

        const string = this.buffer.toString(ENCODING, start, this.index);

        this.expectChar(`"`);

        return string;
    }

     // Parse a string.
     private parseBracketString() : string {
        this.expectChar("[");

        const start = this.index;

        while (this.next !== null && this.next !== "]") {
            this.step();
        }

        const str = this.buffer.toString(ENCODING, start, this.index);

        this.expectChar("]");

        return `[${str}]`;
    }

    private parseQuotelessString() : string {
        const start = this.index;

        while (this.next !== null && !isWhitespace(this.next)) {
            this.step();
        }

        return this.buffer.toString(ENCODING, start, this.index + 1);
    }

    /* Helpers */

    private previous(): string {
        return this.buffer.toString(ENCODING, this.index - 1, this.index);
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
            this.next = this.buffer.toString(ENCODING, this.index, this.index + 1) ;
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