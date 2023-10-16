export declare class JsonAssembler {
    private text_manager;
    private root_json;
    private onStart;
    private onUpdate;
    private onEnd;
    constructor(options: {
        text?: string;
        iterator?: AsyncIterator<string> | Iterator<string>;
        stream_reader?: ReadableStreamDefaultReader<string>;
        onStart?: () => void;
        onUpdate?: (json: object) => void;
        onEnd?: (json: object) => void;
    });
    assembleValue: (root: any, r_index: any) => Promise<any>;
    assembleString: (root: any, r_index: any) => Promise<string>;
    modifySpecialCharacters: (text: string) => string;
    assembleArray: (root: any, r_index: any) => Promise<Array<any>>;
    assembleObject: (root: any, r_index: any) => Promise<object>;
    assemblePrimitive: (char: string | null, root: any, r_index: any) => Promise<any>;
    assemble: () => Promise<any>;
    private sendUpdate;
}
