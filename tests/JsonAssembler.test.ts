import { describe, test } from "vitest";
import { encode, decodeGenerator } from "gpt-tokenizer";
import JsonAssembler from "../src/JsonAssembler";
import { json_test_cases } from "./samples_cases";

describe("Tests for JsonAssembler", () => {
  const createMockStream = (json_string: string) => {
    const tokens = encode(json_string);
    const generator = decodeGenerator(tokens);
    return generator;
  };

  json_test_cases.forEach((value) => {
    test(value.name, async ({ expect }) => {
      const json_string = JSON.stringify(value.json);

      expect(await new JsonAssembler({ text: json_string }).assemble()).toEqual(
        value.json
      );

      const text_stream = createMockStream(json_string);
      expect(
        await new JsonAssembler({ iterator: text_stream }).assemble()
      ).toEqual(value.json);
    });
  });
});
