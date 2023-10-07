import { JSONSchema6Definition } from "json-schema";

export class TextTestCase {
  public name: string;
  public text: string;

  constructor(name: string, text: string) {
    this.name = name;
    this.text = text;
  }
}

export class JsonTestCase {
  public name: string;
  public json: any;
  public json_schema: JSONSchema6Definition;
  constructor(name: string, json: any, json_schema: JSONSchema6Definition) {
    this.name = name;
    this.json = json;
    this.json_schema = json_schema;
  }
}

export const text_test_cases: Array<TextTestCase> = [
  new TextTestCase("Short Sentence", "Hey how are you today?"),
  new TextTestCase(
    "Long Sentence",
    "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor."
  ),
  new TextTestCase("Numeric Text", "1234567890"),
  new TextTestCase("Special Characters", "!@#$%^&*()"),
  new TextTestCase("Mixed Text and Numbers", "The year is 2022"),
  new TextTestCase("Uppercase Text", "HELLO, WORLD"),
  new TextTestCase("Lowercase Text", "goodbye, world"),
  new TextTestCase("Text with Quotes", 'She said, "Hello, My name is Jane."'),
  new TextTestCase("JavaScript Reserved Words", "var let const"),
  new TextTestCase(
    "JavaScript Function Declaration",
    'function hello() { return "Hello World"; }'
  ),
  new TextTestCase("JavaScript Comment", "// This is a comment"),
  new TextTestCase("JavaScript Single Line Code", 'let name = "John";'),
  new TextTestCase(
    "JavaScript Multi Line Code",
    `if (true) {
                                              console.log("True");
                                            } else {
                                              console.log("False");
                                            }`
  ),
  new TextTestCase("URL", "https://www.example.com"),
  new TextTestCase("Email Address", "example@example.com"),
  new TextTestCase("Hexadecimal Number", "0xFF"),
  new TextTestCase("Unicode Characters", "Hello, 世界"),
  new TextTestCase("Emoji Characters", "😀 👍 🐶 🍕"),
  new TextTestCase("Tabs and Newlines", "\tHello\nWorld"),
  new TextTestCase("Escaped Characters", 'Hello, \\"World\\"'),
  new TextTestCase("HTML Tags", "<h1>Hello, World</h1>"),
  new TextTestCase("Array Notation", "let arr = [1,2,3,4]"),
  new TextTestCase("Object Notation", 'let obj = { name: "John", age: 30 }'),
  new TextTestCase(
    "JavaScript exports statement",
    'export const hello = "Hello";'
  ),
  new TextTestCase(
    "JavaScript imports statement",
    'import { Component } from "react";'
  ),
  new TextTestCase(
    "JavaScript Async Syntax",
    "async function fetchPosts() { /*...*/ }"
  ),
  new TextTestCase("Boolean Values as Strings", "true false"),
];

export const json_test_cases: Array<JsonTestCase> = [
  new JsonTestCase(
    "Nested Objects and Arrays Test",
    {
      obj_key: {
        nested_obj: {
          int_key: 109,
          bool_key: false,
          null_key: null,
        },
        arr_key: [1, 2, "three"],
      },
      arr_key: [
        "first",
        2,
        {
          nested_obj: {
            str_key: "nested",
          },
        },
        [],
        [1, 2, 3],
      ],
    },
    {
      type: "object",
      properties: {
        obj_key: {
          type: "object",
          properties: {
            nested_obj: {
              type: "object",
              properties: {
                int_key: { type: "integer" },
                bool_key: { type: "boolean" },
                null_key: { type: "null" },
              },
              required: ["int_key", "bool_key", "null_key"],
            },
            arr_key: {
              type: "array",
              items: {
                anyOf: [{ type: "integer" }, { type: "string" }],
              },
            },
          },
          required: ["nested_obj", "arr_key"],
        },
        arr_key: {
          type: "array",
          items: {
            anyOf: [
              { type: "string" },
              { type: "integer" },
              { type: "array" },
              {
                type: "object",
                properties: {
                  nested_obj: {
                    type: "object",
                    properties: {
                      str_key: { type: "string" },
                    },
                    required: ["str_key"],
                  },
                },
              },
            ],
          },
        },
      },
      required: ["obj_key", "arr_key"],
    }
  ),

  new JsonTestCase(
    "Array Of Primitive Types Test",
    [1, "string", false, null],
    {
      type: "array",
      items: {
        anyOf: [
          { type: "integer" },
          { type: "string" },
          { type: "boolean" },
          { type: "null" },
        ],
      },
    }
  ),

  new JsonTestCase(
    "Empty Object Test",
    {},
    {
      type: "object",
      properties: {},
      additionalProperties: false,
    }
  ),

  new JsonTestCase("Empty Array Test", [], {
    type: "array",
  }),

  new JsonTestCase(
    "Test With Undefined Value",
    {
      str_key: "string",
      undef_key: undefined,
    },
    {
      type: "object",
      properties: {
        str_key: { type: "string" },
        undef_key: { type: "null" },
      },
      required: ["str_key", "undef_key"],
    }
  ),

  new JsonTestCase(
    "Values as Empty Objects Test",
    {
      obj_key1: {},
      obj_key2: {},
      obj_key3: {},
    },
    {
      type: "object",
      properties: {
        obj_key1: { type: "object" },
        obj_key2: { type: "object" },
        obj_key3: { type: "object" },
      },
      required: ["obj_key1", "obj_key2", "obj_key3"],
    }
  ),

  new JsonTestCase(
    "Values as Nested Arrays Test",
    {
      arr_key: [[[]], [1, 2, [3, 4, [5]]], []],
    },
    {
      type: "object",
      properties: {
        arr_key: {
          type: "array",
          items: {
            type: "array",
            items: {
              type: "array",
              items: { anyOf: [{ type: "integer" }, { type: "array" }] },
            },
          },
        },
      },
      additionalProperties: false,
      required: ["arr_key"],
    }
  ),

  new JsonTestCase(
    "Values as Different Type of Primitives",
    {
      str_key: "string",
      num_key: 100,
      bool_key: false,
      null_key: null,
    },
    {
      type: "object",
      properties: {
        str_key: { type: "string" },
        num_key: { type: "integer" },
        bool_key: { type: "boolean" },
        null_key: { type: "null" },
      },
      required: ["str_key", "num_key", "bool_key", "null_key"],
    }
  ),
  new JsonTestCase(
    "Nested Objects Inside Arrays",
    [
      {
        id: 1,
        name: "John Doe",
      },
      {
        id: 2,
        name: "Jane Doe",
      },
    ],
    {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
        },
        required: ["id", "name"],
      },
    }
  ),

  new JsonTestCase(
    "Test With Special Strings",
    {
      special_str_key1: "\\Test",
      special_str_key2: "Line \n Break",
      special_str_key3: "\b\f\n\r\t",
      special_str_key4: "\"Double quotes\" and 'Single quotes'",
    },
    {
      type: "object",
      properties: {
        special_str_key1: { type: "string" },
        special_str_key2: { type: "string" },
        special_str_key3: { type: "string" },
        special_str_key4: { type: "string" },
      },
      required: [
        "special_str_key1",
        "special_str_key2",
        "special_str_key3",
        "special_str_key4",
      ],
    }
  ),
  new JsonTestCase(
    "Mixed Primitive Types In Array",
    ["String", 28, true, null],
    {
      type: "array",
      items: {
        anyOf: [
          { type: "string" },
          { type: "integer" },
          { type: "boolean" },
          { type: "null" },
        ],
      },
    }
  ),

  new JsonTestCase(
    "Multiple Nested Objects",
    {
      level1: {
        level2: {
          level3: {
            level4: "End",
          },
        },
      },
    },
    {
      type: "object",
      properties: {
        level1: {
          type: "object",
          properties: {
            level2: {
              type: "object",
              properties: {
                level3: {
                  type: "object",
                  properties: {
                    level4: { type: "string" },
                  },
                  required: ["level4"],
                },
              },
              required: ["level3"],
            },
          },
          required: ["level2"],
        },
      },
      required: ["level1"],
    }
  ),

  new JsonTestCase(
    "Number Keys Test",
    {
      1: "Number One",
      2: "Number Two",
      3: "Number Three",
    },
    {
      type: "object",
      patternProperties: {
        "^[0-9]+$": {
          type: "string",
        },
      },
    }
  ),

  new JsonTestCase(
    "Unicode String Test",
    {
      unicode_str_key: "Test\u00DCnicode",
    },
    {
      type: "object",
      properties: {
        unicode_str_key: { type: "string" },
      },
      required: ["unicode_str_key"],
    }
  ),

  new JsonTestCase(
    "String Keys Test",
    {
      "key one": "value one",
      "key two": "value two",
      "key three": "value three",
    },
    {
      type: "object",
      patternProperties: {
        "key.+": {
          type: "string",
        },
      },
    }
  ),
];
