"use strict";
// Define ignored and termination characters
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonAssembler = void 0;
const IGNORED_CHARACTERS = [" ", "\n", "\t", "\r"];
const TERMINATION_CHARACTERS = [",", "]", "}"];
// This class assembles the JSON
class JsonAssembler {
    // Initialize JsonAssembler with input JSON text
    constructor(options) {
        // Method to assemble a value from JSON text
        this.assembleValue = (root, r_index) => __awaiter(this, void 0, void 0, function* () {
            // Get the next character out of the ignored characters
            const char = yield this.text_manager.nextChar({ skip: IGNORED_CHARACTERS });
            // Analyze the character and assemble corresponding string, object, array or primitive
            switch (char) {
                case "}": // handle for '}' character
                    return;
                case "]": // handle for ']' character
                    return;
                case '"': // If character is string, assemble string
                    return yield this.assembleString(root, r_index);
                case "{": // If character is object, assemble object
                    return yield this.assembleObject(root, r_index);
                case "[": // If character is array, assemble array
                    return yield this.assembleArray(root, r_index);
                default:
                    // If character is other type, assemble primitive
                    if (char)
                        return yield this.assemblePrimitive(char, root, r_index);
            }
        });
        // Method to assemble a string value
        this.assembleString = (root, r_index) => __awaiter(this, void 0, void 0, function* () {
            let output_string = "";
            // Get the next characters and append them to the output_string until find '"' character
            let char = yield this.text_manager.nextChar();
            let prev_char = null;
            while (char) {
                if (char === '"' && prev_char !== "\\") {
                    break;
                }
                else {
                    output_string += char;
                    if (root && r_index) {
                        root[r_index] = output_string;
                        this.sendUpdate();
                    }
                }
                prev_char = char;
                char = yield this.text_manager.nextChar();
            }
            return this.modifySpecialCharacters(output_string);
        });
        // Method to replace special characters to their actual representation
        this.modifySpecialCharacters = (text) => text
            .replace(/\\n/g, "\n")
            .replace(/\\b/g, "\b")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t")
            .replace(/\\f/g, "\f")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\");
        // Method to assemble an array value
        this.assembleArray = (root, r_index) => __awaiter(this, void 0, void 0, function* () {
            const output_array = [];
            if (!this.root_json)
                this.root_json = output_array;
            // Parsing the array characters from JSON text and append them into output_array
            let index = 0;
            let char = yield this.text_manager.nextChar({ skip: IGNORED_CHARACTERS });
            while (char && char != "]") {
                this.text_manager.returnChar(char);
                const value = yield this.assembleValue(output_array, index);
                output_array[index] = value;
                index++;
                if (root && r_index) {
                    root[r_index] = output_array;
                    this.sendUpdate();
                }
                char = yield this.text_manager.nextChar({
                    skip: [",", ...IGNORED_CHARACTERS],
                });
            }
            return output_array;
        });
        // Method to assemble an object value
        this.assembleObject = (root, r_index) => __awaiter(this, void 0, void 0, function* () {
            const output_obj = {};
            if (!this.root_json)
                this.root_json = output_obj;
            // Parsing the object fields from JSON text and append them into the output object
            let char = yield this.text_manager.nextChar({ skip: IGNORED_CHARACTERS });
            while (char && char != "}") {
                if (char == '"') {
                    const key = yield this.assembleString(null, null);
                    output_obj[key] = undefined;
                    if (root && r_index) {
                        root[r_index] = output_obj;
                        this.sendUpdate();
                    }
                    yield this.text_manager.nextChar({ until: [":"] });
                    const value = yield this.assembleValue(output_obj, key);
                    output_obj[key] = value;
                    if (root && r_index) {
                        root[r_index] = output_obj;
                        this.sendUpdate();
                    }
                }
                char = yield this.text_manager.nextChar({ skip: IGNORED_CHARACTERS });
            }
            return output_obj;
        });
        // Method to assemble a primitive value
        this.assemblePrimitive = (char, root, r_index) => __awaiter(this, void 0, void 0, function* () {
            let output_primitive = char;
            // Parse the primitive from JSON text
            char = yield this.text_manager.nextChar();
            while (char) {
                if (char && TERMINATION_CHARACTERS.includes(char)) {
                    this.text_manager.returnChar(char);
                    break;
                }
                output_primitive += char;
                char = yield this.text_manager.nextChar();
            }
            if (!output_primitive)
                return output_primitive;
            // Convert output_primitive to corresponding types (number, boolean, null, undefined)
            const num = parseFloat(output_primitive);
            if (!isNaN(num)) {
                return num;
            }
            if (output_primitive === "true")
                return true;
            if (output_primitive === "false")
                return false;
            if (output_primitive === "null")
                return null;
            if (output_primitive === "undefined")
                return undefined;
            return output_primitive;
        });
        // Entry method to start assembleing JSON from text
        this.assemble = () => __awaiter(this, void 0, void 0, function* () {
            if (this.onStart)
                this.onStart();
            const result = yield this.assembleValue(null, null);
            if (this.onEnd)
                this.onEnd(result);
            return result;
        });
        this.sendUpdate = () => {
            if (this.onUpdate && this.root_json)
                this.onUpdate(this.root_json);
        };
        const { text, iterator, stream_reader, onStart, onUpdate, onEnd } = options;
        if ((text && iterator) ||
            (text && stream_reader) ||
            (iterator && stream_reader))
            throw Error('Please initialize only one of "text", "iterator", or "stream_reader".');
        if (!text && !iterator && !stream_reader)
            throw Error('Please initialize one of "text", "iterator" or "stream_reader".');
        if (iterator)
            this.text_manager = new IteratorTextManager(iterator);
        else if (text)
            this.text_manager = new StaticTextManager(text);
        else if (stream_reader)
            this.text_manager = new StreamTextManager(stream_reader);
        else
            throw Error("Couldn't instantiate a text manager");
        this.onStart = onStart;
        this.onUpdate = onUpdate;
        this.onEnd = onEnd;
    }
}
exports.JsonAssembler = JsonAssembler;
class StreamTextManager {
    constructor(stream_reader) {
        this.test = "";
        this.nextCharFromStream = () => __awaiter(this, void 0, void 0, function* () {
            if (this.buffer.length == 0) {
                const { value, done } = yield this.stream_reader.read();
                if (value && !done)
                    this.buffer += value;
            }
            if (this.buffer.length > 0) {
                const char = this.buffer.charAt(0);
                this.buffer = this.buffer.slice(1, this.buffer.length);
                return char;
            }
            return null;
        });
        this.nextChar = (options) => __awaiter(this, void 0, void 0, function* () {
            // If text is empty, return null
            let char = yield this.nextCharFromStream();
            // Iterate until find character or end of text
            if (options === null || options === void 0 ? void 0 : options.until) {
                while (char && !options.until.includes(char)) {
                    char = yield this.nextCharFromStream();
                }
            }
            else if (options === null || options === void 0 ? void 0 : options.skip) {
                // Skip characters which are included in 'skip' option
                while (char && options.skip.includes(char)) {
                    char = yield this.nextCharFromStream();
                }
            }
            return char;
        });
        this.returnChar = (char) => {
            this.buffer = char + this.buffer;
        };
        this.stream_reader = stream_reader;
        this.buffer = "";
    }
}
class IteratorTextManager {
    constructor(async_iterator) {
        this.test = "";
        this.nextCharFromStream = () => __awaiter(this, void 0, void 0, function* () {
            if (this.buffer.length == 0) {
                const { value, done } = yield this.async_iterator.next();
                if (value && !done)
                    this.buffer += value;
            }
            if (this.buffer.length > 0) {
                const char = this.buffer.charAt(0);
                this.buffer = this.buffer.slice(1, this.buffer.length);
                return char;
            }
            return null;
        });
        this.nextChar = (options) => __awaiter(this, void 0, void 0, function* () {
            // If text is empty, return null
            let char = yield this.nextCharFromStream();
            // Iterate until find character or end of text
            if (options === null || options === void 0 ? void 0 : options.until) {
                while (char && !options.until.includes(char)) {
                    char = yield this.nextCharFromStream();
                }
            }
            else if (options === null || options === void 0 ? void 0 : options.skip) {
                // Skip characters which are included in 'skip' option
                while (char && options.skip.includes(char)) {
                    char = yield this.nextCharFromStream();
                }
            }
            return char;
        });
        this.returnChar = (char) => {
            this.buffer = char + this.buffer;
        };
        this.async_iterator = async_iterator;
        this.buffer = "";
    }
}
// This class manages the JSON text
class StaticTextManager {
    // Initialize JsonTextManager with input JSON text
    constructor(input_json_text) {
        // Method to get next character with some options like 'until' and 'skip'
        this.nextChar = (options) => __awaiter(this, void 0, void 0, function* () {
            // If text is empty, return null
            if (this.json_text.length == 0)
                return null;
            let index = 0;
            let char = this.json_text.charAt(index++);
            // Iterate until find character or end of text
            if (options === null || options === void 0 ? void 0 : options.until) {
                while (char && !options.until.includes(char)) {
                    char =
                        index < this.json_text.length ? this.json_text.charAt(index++) : null;
                }
            }
            else if (options === null || options === void 0 ? void 0 : options.skip) {
                // Skip characters which are included in 'skip' option
                while (char && options.skip.includes(char))
                    char =
                        index < this.json_text.length ? this.json_text.charAt(index++) : null;
            }
            // remove processed characters in json_text
            this.json_text = this.json_text.slice(index, this.json_text.length);
            return char;
        });
        this.json_text = input_json_text;
    }
    // Method to return the character to json_text
    returnChar(char) {
        this.json_text = char + this.json_text;
    }
}
