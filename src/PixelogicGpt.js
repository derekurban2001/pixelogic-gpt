"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PixelogicGpt = void 0;
const openai_1 = require("openai");
const JsonAssembler_1 = require("./JsonAssembler");
class PixelogicGpt {
    constructor(api_key, options) {
        this.chatCompletion = (args, json) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            if (!args)
                throw new Error("Cannot call Chat Completion with empty arguments");
            try {
                const completion = yield this.openai_client.chat.completions.create(Object.assign(Object.assign(Object.assign({}, args), this.schemaCallTransformer(json)), { stream: false }));
                const result = json
                    ? yield this.staticSchemaExtractor(completion.choices[0].message.function_call)
                    : completion.choices[0].message.content;
                const prompt_tokens = (_b = (_a = completion.usage) === null || _a === void 0 ? void 0 : _a.prompt_tokens) !== null && _b !== void 0 ? _b : -1;
                const completion_tokens = (_d = (_c = completion.usage) === null || _c === void 0 ? void 0 : _c.completion_tokens) !== null && _d !== void 0 ? _d : -1;
                return { result, prompt_tokens, completion_tokens };
            }
            catch (error) {
                throw error;
            }
        });
        this.streamChatCompletion = (args, json) => __awaiter(this, void 0, void 0, function* () {
            if (!args)
                throw new Error("Cannot call Chat Completion with empty arguments");
            try {
                const completion_stream = yield this.openai_client.chat.completions.create(Object.assign(Object.assign(Object.assign({}, args), this.schemaCallTransformer(json)), { stream: true }));
                const result = this.readableStreamTransformer(completion_stream, !!json);
                const prompt_tokens = 0;
                const completion_tokens = 0;
                return { result, prompt_tokens, completion_tokens };
            }
            catch (error) {
                throw error;
            }
        });
        this.readableStreamTransformer = (stream, json_expected = false) => {
            const asyncIterator = stream[Symbol.asyncIterator]();
            if (json_expected) {
                return (function () {
                    var _a, _b;
                    return __asyncGenerator(this, arguments, function* () {
                        var _c, e_1, _d, _e;
                        try {
                            for (var _f = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield __await(stream_1.next()), _c = stream_1_1.done, !_c; _f = true) {
                                _e = stream_1_1.value;
                                _f = false;
                                const chunk = _e;
                                yield yield __await((_b = (_a = chunk.choices[0].delta.function_call) === null || _a === void 0 ? void 0 : _a.arguments) !== null && _b !== void 0 ? _b : "");
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (!_f && !_c && (_d = stream_1.return)) yield __await(_d.call(stream_1));
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                    });
                })();
            }
            else {
                return (function () {
                    var _a;
                    return __asyncGenerator(this, arguments, function* () {
                        var _b, e_2, _c, _d;
                        try {
                            for (var _e = true, stream_2 = __asyncValues(stream), stream_2_1; stream_2_1 = yield __await(stream_2.next()), _b = stream_2_1.done, !_b; _e = true) {
                                _d = stream_2_1.value;
                                _e = false;
                                const chunk = _d;
                                yield yield __await((_a = chunk.choices[0].delta.content) !== null && _a !== void 0 ? _a : "");
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (!_e && !_b && (_c = stream_2.return)) yield __await(_c.call(stream_2));
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                    });
                })();
            }
        };
        this.schemaCallTransformer = (json) => {
            if (!json)
                return {};
            return {
                function_call: { name: "response" },
                functions: [
                    {
                        name: "response",
                        parameters: {
                            type: "object",
                            properties: Object.assign({}, json),
                            required: Object.keys(json),
                        },
                        description: "Your response to the query.",
                    },
                ],
            };
        };
        this.openai_client = new openai_1.OpenAI(Object.assign(Object.assign({}, (options !== null && options !== void 0 ? options : {})), { apiKey: api_key }));
    }
    staticSchemaExtractor(function_call) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!function_call)
                throw Error("Function Call Failed");
            const json_assembler = new JsonAssembler_1.JsonAssembler({ text: function_call.arguments });
            return yield json_assembler.assemble();
        });
    }
}
exports.PixelogicGpt = PixelogicGpt;
