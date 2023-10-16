import { JSONSchema6Definition } from "json-schema";
import { OpenAI, ClientOptions } from "openai";
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";
import { Stream } from "openai/streaming";
interface PixelCompletionParams extends Omit<ChatCompletionCreateParamsBase, "function_call" | "functions" | "stream"> {
}
export declare class PixelogicGpt {
    private openai_client;
    constructor(api_key: string, options?: ClientOptions);
    chatCompletion: (args: PixelCompletionParams, json?: Record<string, JSONSchema6Definition>) => Promise<{
        result: any;
        prompt_tokens: number;
        completion_tokens: number;
    }>;
    staticSchemaExtractor(function_call?: OpenAI.Chat.Completions.ChatCompletionMessage.FunctionCall): Promise<any>;
    streamChatCompletion: (args: PixelCompletionParams, json?: Record<string, JSONSchema6Definition>) => Promise<{
        result: AsyncGenerator<string, void, unknown>;
        prompt_tokens: number;
        completion_tokens: number;
    }>;
    readableStreamTransformer: (stream: Stream<OpenAI.Chat.Completions.ChatCompletionChunk>, json_expected?: boolean) => AsyncGenerator<string, void, unknown>;
    schemaCallTransformer: (json?: Record<string, JSONSchema6Definition>) => {
        function_call?: undefined;
        functions?: undefined;
    } | {
        function_call: {
            name: string;
        };
        functions: {
            name: string;
            parameters: {
                type: string;
                properties: {
                    [x: string]: JSONSchema6Definition;
                };
                required: string[];
            };
            description: string;
        }[];
    };
}
export {};
