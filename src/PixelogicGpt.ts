import { SchemaMap } from "ajv/dist/types";
import { JSONSchema6, JSONSchema6Definition } from "json-schema";
import { OpenAI, ClientOptions } from "openai";
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";
import { JsonAssembler } from "./JsonAssembler";
import { Stream } from "openai/streaming";

interface PixelCompletionParams
  extends Omit<
    ChatCompletionCreateParamsBase,
    "function_call" | "functions" | "stream"
  > {}

export class PixelogicGpt {
  private openai_client;

  constructor(api_key: string, options?: ClientOptions) {
    this.openai_client = new OpenAI({
      ...(options ?? {}),
      apiKey: api_key,
    });
  }

  public chatCompletion = async (
    args: PixelCompletionParams,
    json?: Record<string, JSONSchema6Definition>
  ) => {
    if (!args)
      throw new Error("Cannot call Chat Completion with empty arguments");

    try {
      const completion = await this.openai_client.chat.completions.create({
        ...args,
        ...this.schemaCallTransformer(json),
        stream: false,
      });
      const result = json
        ? await this.staticSchemaExtractor(
            completion.choices[0].message.function_call
          )
        : completion.choices[0].message.content;
      const prompt_tokens = completion.usage?.prompt_tokens ?? -1;
      const completion_tokens = completion.usage?.completion_tokens ?? -1;
      return { result, prompt_tokens, completion_tokens };
    } catch (error) {
      throw error;
    }
  };

  public async staticSchemaExtractor(
    function_call?: OpenAI.Chat.Completions.ChatCompletionMessage.FunctionCall
  ) {
    if (!function_call) throw Error("Function Call Failed");
    const json_assembler = new JsonAssembler({ text: function_call.arguments });
    return await json_assembler.assemble();
  }

  public streamChatCompletion = async (
    args: PixelCompletionParams,
    json?: Record<string, JSONSchema6Definition>
  ) => {
    if (!args)
      throw new Error("Cannot call Chat Completion with empty arguments");

    try {
      const completion_stream =
        await this.openai_client.chat.completions.create({
          ...args,
          ...this.schemaCallTransformer(json),
          stream: true,
        });

      const result = this.readableStreamTransformer(completion_stream, !!json);
      const prompt_tokens = 0;
      const completion_tokens = 0;
      return { result, prompt_tokens, completion_tokens };
    } catch (error) {
      throw error;
    }
  };

  public readableStreamTransformer = (
    stream: Stream<OpenAI.Chat.Completions.ChatCompletionChunk>,
    json_expected = false
  ) => {
    const asyncIterator = stream[Symbol.asyncIterator]() as AsyncIterator<
      OpenAI.Chat.Completions.ChatCompletionChunk,
      OpenAI.Chat.Completions.ChatCompletionChunk | undefined,
      undefined
    >;

    if (json_expected) {
      return (async function* () {
        for await (const chunk of stream)
          yield chunk.choices[0].delta.function_call?.arguments ?? "";
      })();
    } else {
      return (async function* () {
        for await (const chunk of stream)
          yield chunk.choices[0].delta.content ?? "";
      })();
    }
  };

  public schemaCallTransformer = (
    json?: Record<string, JSONSchema6Definition>
  ) => {
    if (!json) return {};
    return {
      function_call: { name: "response" },
      functions: [
        {
          name: "response",
          parameters: {
            type: "object",
            properties: {
              ...json,
            },
            required: Object.keys(json),
          },
          description: "Your response to the query.",
        },
      ],
    };
  };
}
