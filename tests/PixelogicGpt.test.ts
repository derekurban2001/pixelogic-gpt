import { beforeEach, describe, test, vi } from "vitest";
import { PixelogicGpt } from "../src/PixelogicGpt";
import { decodeGenerator, encode } from "gpt-tokenizer";
import { JSONSchema6Definition } from "json-schema";
import { json_test_cases, text_test_cases } from "./samples_cases";
import OpenAI from "openai";
import { JsonAssembler } from "../src/JsonAssembler";

type MockResult = {
  result: string | object;
  prompt_tokens: number;
  completion_tokens: number;
};

const mock_create = vi.hoisted(() => {
  return {
    create: vi.fn(),
  };
});

vi.mock("OpenAi", () => {
  class OpenAiTest {
    constructor() {}

    public chat = {
      completions: {
        create: mock_create.create,
      },
    };
  }

  return {
    OpenAI: OpenAiTest,
  };
});

const generateMockStream = (
  completion_result: OpenAI.Chat.Completions.ChatCompletion
) => {
  const message = completion_result.choices[0].message;
  const is_message = !!message.content;
  const result = message.function_call?.arguments
    ? message.function_call.arguments
    : message.content ?? "";
  const tokens = encode(result);
  const generator = decodeGenerator(tokens);
  const asyncGeneratorFunction = async function* () {
    for await (const value of generator)
      yield {
        ...completion_result,
        choices: [
          {
            index: 0,
            delta: {
              role: "assistant",
              content: is_message ? value : "",
              function_call: is_message
                ? undefined
                : {
                    arguments: value,
                  },
            },
            finish_reason: "stop",
          },
        ],
      };
  };
  return {
    [Symbol.asyncIterator]: asyncGeneratorFunction,
  };
};

const setReturnMockResult = (mock_result: MockResult, stream = false) => {
  const is_message = typeof mock_result.result === "string";
  const completion_result: OpenAI.Chat.Completions.ChatCompletion = {
    id: "test-id",
    created: -1,
    model: "test-model",
    object: "test-object",
    choices: [
      {
        message: {
          role: "assistant",
          content: is_message ? (mock_result.result as string) : "",
          function_call: is_message
            ? undefined
            : {
                name: "response",
                arguments: JSON.stringify(mock_result.result),
              },
        },
        finish_reason: "stop",
        index: 0,
      },
    ],
    usage: {
      total_tokens: 0,
      prompt_tokens: mock_result.prompt_tokens,
      completion_tokens: mock_result.completion_tokens,
    },
  };

  if (stream) {
    const stream = generateMockStream(completion_result);

    mock_create.create.mockReturnValue(stream);
  } else {
    mock_create.create.mockReturnValue(completion_result);
  }
};

describe("Tests for PixelogicGpt Class", () => {
  let gpt: PixelogicGpt;

  beforeEach(() => {
    gpt = new PixelogicGpt("api-key");
  });

  text_test_cases.forEach((value) => {
    test("Static: " + value.name, async ({ expect }) => {
      const expected_result: MockResult = {
        result: value.text,
        prompt_tokens: 0,
        completion_tokens: 0,
      };
      setReturnMockResult(expected_result);

      const result = await gpt.chatCompletion({
        model: "gpt-3.5-turbo",
        messages: [],
      });

      expect(result).toEqual(expected_result);
    });
  });

  json_test_cases.forEach((value) => {
    test("Static: " + value.name, async ({ expect }) => {
      const json_schema: Record<string, JSONSchema6Definition> = {
        json: value.json_schema,
      };

      const sample_json = {
        json: value.json,
      };

      const expected_result: MockResult = {
        result: sample_json,
        prompt_tokens: 0,
        completion_tokens: 0,
      };
      setReturnMockResult(expected_result);

      const result = await gpt.chatCompletion(
        {
          model: "gpt-3.5-turbo",
          messages: [],
        },
        json_schema
      );

      expect(result).toEqual(expected_result);
    });
  });

  text_test_cases.forEach((value) => {
    test("Stream: " + value.name, async ({ expect }) => {
      const expected_result: MockResult = {
        result: value.text,
        prompt_tokens: 0,
        completion_tokens: 0,
      };
      setReturnMockResult(expected_result, true);

      const result = await gpt.streamChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [],
      });

      let text_result = "";
      for await (const v of result.result) {
        text_result += v;
      }

      const revised_result = {
        ...result,
        result: text_result,
      };

      expect(revised_result).toEqual(expected_result);
    });
  });

  json_test_cases.forEach((value) => {
    test("Stream: " + value.name, async ({ expect }) => {
      const json_schema: Record<string, JSONSchema6Definition> = {
        json: value.json_schema,
      };

      const sample_json = {
        json: value.json,
      };

      const expected_result: MockResult = {
        result: sample_json,
        prompt_tokens: 0,
        completion_tokens: 0,
      };
      setReturnMockResult(expected_result, true);

      const result = await gpt.streamChatCompletion(
        {
          model: "gpt-3.5-turbo",
          messages: [],
        },
        sample_json
      );

      const json_assembler = new JsonAssembler({
        iterator: result.result[Symbol.asyncIterator](),
      });
      let json_result = await json_assembler.assemble();

      const revised_result = {
        ...result,
        result: json_result,
      };

      expect(revised_result).toEqual(expected_result);
    });
  });
});
