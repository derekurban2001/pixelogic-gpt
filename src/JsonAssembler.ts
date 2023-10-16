// Define ignored and termination characters

import { readBuilderProgram } from "typescript";

const IGNORED_CHARACTERS = [" ", "\n", "\t", "\r"];

const TERMINATION_CHARACTERS = [",", "]", "}"];

// This class assembles the JSON

export class JsonAssembler {
  // Declare JsonTextManager

  private text_manager: TextManager;

  private root_json: any;

  private onStart: (() => void) | undefined;
  private onUpdate: ((json: any) => void) | undefined;
  private onEnd: ((json: any) => void) | undefined;

  // Initialize JsonAssembler with input JSON text

  constructor(options: {
    text?: string;
    iterator?: AsyncIterator<string> | Iterator<string>;
    stream_reader?: ReadableStreamDefaultReader<string>;
    onStart?: () => void;
    onUpdate?: (json: object) => void;
    onEnd?: (json: object) => void;
  }) {
    const { text, iterator, stream_reader, onStart, onUpdate, onEnd } = options;
    if (
      (text && iterator) ||
      (text && stream_reader) ||
      (iterator && stream_reader)
    )
      throw Error(
        'Please initialize only one of "text", "iterator", or "stream_reader".'
      );
    if (!text && !iterator && !stream_reader)
      throw Error(
        'Please initialize one of "text", "iterator" or "stream_reader".'
      );

    if (iterator) this.text_manager = new IteratorTextManager(iterator);
    else if (text) this.text_manager = new StaticTextManager(text);
    else if (stream_reader)
      this.text_manager = new StreamTextManager(stream_reader);
    else throw Error("Couldn't instantiate a text manager");

    this.onStart = onStart;
    this.onUpdate = onUpdate;
    this.onEnd = onEnd;
  }

  // Method to assemble a value from JSON text

  public assembleValue = async (root: any, r_index: any): Promise<any> => {
    // Get the next character out of the ignored characters

    const char = await this.text_manager.nextChar({ skip: IGNORED_CHARACTERS });

    // Analyze the character and assemble corresponding string, object, array or primitive

    switch (char) {
      case "}": // handle for '}' character
        return;
      case "]": // handle for ']' character
        return;
      case '"': // If character is string, assemble string
        return await this.assembleString(root, r_index);
      case "{": // If character is object, assemble object
        return await this.assembleObject(root, r_index);
      case "[": // If character is array, assemble array
        return await this.assembleArray(root, r_index);
      default:
        // If character is other type, assemble primitive
        if (char) return await this.assemblePrimitive(char, root, r_index);
    }
  };

  // Method to assemble a string value

  public assembleString = async (root: any, r_index: any): Promise<string> => {
    let output_string = "";

    // Get the next characters and append them to the output_string until find '"' character

    let char = await this.text_manager.nextChar();

    let prev_char = null;

    while (char) {
      if (char === '"' && prev_char !== "\\") {
        break;
      } else {
        output_string += char;
        if (root && r_index) {
          root[r_index] = output_string;
          this.sendUpdate();
        }
      }

      prev_char = char;

      char = await this.text_manager.nextChar();
    }

    return this.modifySpecialCharacters(output_string);
  };

  // Method to replace special characters to their actual representation

  public modifySpecialCharacters = (text: string) =>
    text
      .replace(/\\n/g, "\n")
      .replace(/\\b/g, "\b")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\f/g, "\f")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");

  // Method to assemble an array value

  public assembleArray = async (
    root: any,
    r_index: any
  ): Promise<Array<any>> => {
    const output_array: Array<any> = [];

    if (!this.root_json) this.root_json = output_array;
    // Parsing the array characters from JSON text and append them into output_array

    let index = 0;
    let char = await this.text_manager.nextChar({ skip: IGNORED_CHARACTERS });
    while (char && char != "]") {
      this.text_manager.returnChar(char);

      const value = await this.assembleValue(output_array, index);
      output_array[index] = value;
      index++;

      if (root && r_index) {
        root[r_index] = output_array;
        this.sendUpdate();
      }

      char = await this.text_manager.nextChar({
        skip: [",", ...IGNORED_CHARACTERS],
      });
    }

    return output_array;
  };

  // Method to assemble an object value

  public assembleObject = async (root: any, r_index: any): Promise<object> => {
    const output_obj: Record<string, any> = {};

    if (!this.root_json) this.root_json = output_obj;
    // Parsing the object fields from JSON text and append them into the output object

    let char = await this.text_manager.nextChar({ skip: IGNORED_CHARACTERS });

    while (char && char != "}") {
      if (char == '"') {
        const key = await this.assembleString(null, null);

        output_obj[key] = undefined;
        if (root && r_index) {
          root[r_index] = output_obj;
          this.sendUpdate();
        }

        await this.text_manager.nextChar({ until: [":"] });

        const value = await this.assembleValue(output_obj, key);

        output_obj[key] = value;
        if (root && r_index) {
          root[r_index] = output_obj;
          this.sendUpdate();
        }
      }

      char = await this.text_manager.nextChar({ skip: IGNORED_CHARACTERS });
    }

    return output_obj;
  };

  // Method to assemble a primitive value

  public assemblePrimitive = async (
    char: string | null,
    root: any,
    r_index: any
  ): Promise<any> => {
    let output_primitive = char;

    // Parse the primitive from JSON text

    char = await this.text_manager.nextChar();

    while (char) {
      if (char && TERMINATION_CHARACTERS.includes(char)) {
        this.text_manager.returnChar(char);

        break;
      }

      output_primitive += char;

      char = await this.text_manager.nextChar();
    }

    if (!output_primitive) return output_primitive;

    // Convert output_primitive to corresponding types (number, boolean, null, undefined)

    output_primitive = output_primitive.replace(/\\n/g, "");

    const num = parseFloat(output_primitive);

    if (!isNaN(num)) {
      return num;
    }

    if (output_primitive === "true") return true;

    if (output_primitive === "false") return false;

    if (output_primitive === "null") return null;

    if (output_primitive === "undefined") return undefined;

    return output_primitive;
  };

  // Entry method to start assembleing JSON from text

  public assemble = async () => {
    if (this.onStart) this.onStart();
    const result = await this.assembleValue(null, null);
    if (this.onEnd) this.onEnd(result);
    return result;
  };

  private sendUpdate = () => {
    if (this.onUpdate && this.root_json) this.onUpdate(this.root_json);
  };
}

type NextCharacterOptions = {
  until?: Array<string>;
  skip?: Array<string>;
};

interface TextManager {
  nextChar: (options?: NextCharacterOptions) => Promise<string | null>;
  returnChar: (char: string) => void;
}

class StreamTextManager implements TextManager {
  private stream_reader: ReadableStreamDefaultReader<string>;
  private buffer: string;

  private test: string = "";
  constructor(stream_reader: ReadableStreamDefaultReader<string>) {
    this.stream_reader = stream_reader;
    this.buffer = "";
  }

  public nextCharFromStream = async () => {
    if (this.buffer.length == 0) {
      const { value, done } = await this.stream_reader.read();
      if (value && !done) this.buffer += value;
    }
    if (this.buffer.length > 0) {
      const char = this.buffer.charAt(0);
      this.buffer = this.buffer.slice(1, this.buffer.length);
      return char;
    }
    return null;
  };

  public nextChar = async (options?: NextCharacterOptions | undefined) => {
    // If text is empty, return null
    let char = await this.nextCharFromStream();

    // Iterate until find character or end of text

    if (options?.until) {
      while (char && !options.until.includes(char)) {
        char = await this.nextCharFromStream();
      }
    } else if (options?.skip) {
      // Skip characters which are included in 'skip' option

      while (char && options.skip.includes(char)) {
        char = await this.nextCharFromStream();
      }
    }

    return char;
  };

  public returnChar = (char: string) => {
    this.buffer = char + this.buffer;
  };
}

class IteratorTextManager implements TextManager {
  private async_iterator: AsyncIterator<string> | Iterator<string>;
  private buffer: string;

  private test: string = "";
  constructor(async_iterator: AsyncIterator<string> | Iterator<string>) {
    this.async_iterator = async_iterator;
    this.buffer = "";
  }

  public nextCharFromStream = async () => {
    if (this.buffer.length == 0) {
      const { value, done } = await this.async_iterator.next();
      if (value && !done) this.buffer += value;
    }
    if (this.buffer.length > 0) {
      const char = this.buffer.charAt(0);
      this.buffer = this.buffer.slice(1, this.buffer.length);
      return char;
    }
    return null;
  };

  public nextChar = async (options?: NextCharacterOptions | undefined) => {
    // If text is empty, return null
    let char = await this.nextCharFromStream();

    // Iterate until find character or end of text

    if (options?.until) {
      while (char && !options.until.includes(char)) {
        char = await this.nextCharFromStream();
      }
    } else if (options?.skip) {
      // Skip characters which are included in 'skip' option

      while (char && options.skip.includes(char)) {
        char = await this.nextCharFromStream();
      }
    }

    return char;
  };

  public returnChar = (char: string) => {
    this.buffer = char + this.buffer;
  };
}

// This class manages the JSON text
class StaticTextManager implements TextManager {
  private json_text: string;

  // Initialize JsonTextManager with input JSON text

  constructor(input_json_text: string) {
    this.json_text = input_json_text;
  }

  // Method to get next character with some options like 'until' and 'skip'

  public nextChar = async (options?: NextCharacterOptions) => {
    // If text is empty, return null

    if (this.json_text.length == 0) return null;

    let index = 0;

    let char: string | null = this.json_text.charAt(index++);

    // Iterate until find character or end of text

    if (options?.until) {
      while (char && !options.until.includes(char)) {
        char =
          index < this.json_text.length ? this.json_text.charAt(index++) : null;
      }
    } else if (options?.skip) {
      // Skip characters which are included in 'skip' option

      while (char && options.skip.includes(char))
        char =
          index < this.json_text.length ? this.json_text.charAt(index++) : null;
    }

    // remove processed characters in json_text

    this.json_text = this.json_text.slice(index, this.json_text.length);

    return char;
  };

  // Method to return the character to json_text

  public returnChar(char: string) {
    this.json_text = char + this.json_text;
  }
}
