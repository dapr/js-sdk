// package: dapr.proto.runtime.v1
// file: dapr/proto/runtime/v1/ai.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as google_protobuf_duration_pb from "google-protobuf/google/protobuf/duration_pb";

export class ConversationRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): ConversationRequest;

    hasContextid(): boolean;
    clearContextid(): void;
    getContextid(): string | undefined;
    setContextid(value: string): ConversationRequest;
    clearInputsList(): void;
    getInputsList(): Array<ConversationInput>;
    setInputsList(value: Array<ConversationInput>): ConversationRequest;
    addInputs(value?: ConversationInput, index?: number): ConversationInput;

    getParametersMap(): jspb.Map<string, google_protobuf_any_pb.Any>;
    clearParametersMap(): void;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    hasScrubpii(): boolean;
    clearScrubpii(): void;
    getScrubpii(): boolean | undefined;
    setScrubpii(value: boolean): ConversationRequest;

    hasTemperature(): boolean;
    clearTemperature(): void;
    getTemperature(): number | undefined;
    setTemperature(value: number): ConversationRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationRequest): ConversationRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationRequest;
    static deserializeBinaryFromReader(message: ConversationRequest, reader: jspb.BinaryReader): ConversationRequest;
}

export namespace ConversationRequest {
    export type AsObject = {
        name: string,
        contextid?: string,
        inputsList: Array<ConversationInput.AsObject>,

        parametersMap: Array<[string, google_protobuf_any_pb.Any.AsObject]>,

        metadataMap: Array<[string, string]>,
        scrubpii?: boolean,
        temperature?: number,
    }
}

export class ConversationRequestAlpha2 extends jspb.Message { 
    getName(): string;
    setName(value: string): ConversationRequestAlpha2;

    hasContextId(): boolean;
    clearContextId(): void;
    getContextId(): string | undefined;
    setContextId(value: string): ConversationRequestAlpha2;
    clearInputsList(): void;
    getInputsList(): Array<ConversationInputAlpha2>;
    setInputsList(value: Array<ConversationInputAlpha2>): ConversationRequestAlpha2;
    addInputs(value?: ConversationInputAlpha2, index?: number): ConversationInputAlpha2;

    getParametersMap(): jspb.Map<string, google_protobuf_any_pb.Any>;
    clearParametersMap(): void;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    hasScrubPii(): boolean;
    clearScrubPii(): void;
    getScrubPii(): boolean | undefined;
    setScrubPii(value: boolean): ConversationRequestAlpha2;

    hasTemperature(): boolean;
    clearTemperature(): void;
    getTemperature(): number | undefined;
    setTemperature(value: number): ConversationRequestAlpha2;
    clearToolsList(): void;
    getToolsList(): Array<ConversationTools>;
    setToolsList(value: Array<ConversationTools>): ConversationRequestAlpha2;
    addTools(value?: ConversationTools, index?: number): ConversationTools;

    hasToolChoice(): boolean;
    clearToolChoice(): void;
    getToolChoice(): string | undefined;
    setToolChoice(value: string): ConversationRequestAlpha2;

    hasResponseFormat(): boolean;
    clearResponseFormat(): void;
    getResponseFormat(): google_protobuf_struct_pb.Struct | undefined;
    setResponseFormat(value?: google_protobuf_struct_pb.Struct): ConversationRequestAlpha2;

    hasPromptCacheRetention(): boolean;
    clearPromptCacheRetention(): void;
    getPromptCacheRetention(): google_protobuf_duration_pb.Duration | undefined;
    setPromptCacheRetention(value?: google_protobuf_duration_pb.Duration): ConversationRequestAlpha2;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationRequestAlpha2.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationRequestAlpha2): ConversationRequestAlpha2.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationRequestAlpha2, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationRequestAlpha2;
    static deserializeBinaryFromReader(message: ConversationRequestAlpha2, reader: jspb.BinaryReader): ConversationRequestAlpha2;
}

export namespace ConversationRequestAlpha2 {
    export type AsObject = {
        name: string,
        contextId?: string,
        inputsList: Array<ConversationInputAlpha2.AsObject>,

        parametersMap: Array<[string, google_protobuf_any_pb.Any.AsObject]>,

        metadataMap: Array<[string, string]>,
        scrubPii?: boolean,
        temperature?: number,
        toolsList: Array<ConversationTools.AsObject>,
        toolChoice?: string,
        responseFormat?: google_protobuf_struct_pb.Struct.AsObject,
        promptCacheRetention?: google_protobuf_duration_pb.Duration.AsObject,
    }
}

export class ConversationInput extends jspb.Message { 
    getContent(): string;
    setContent(value: string): ConversationInput;

    hasRole(): boolean;
    clearRole(): void;
    getRole(): string | undefined;
    setRole(value: string): ConversationInput;

    hasScrubpii(): boolean;
    clearScrubpii(): void;
    getScrubpii(): boolean | undefined;
    setScrubpii(value: boolean): ConversationInput;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationInput.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationInput): ConversationInput.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationInput, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationInput;
    static deserializeBinaryFromReader(message: ConversationInput, reader: jspb.BinaryReader): ConversationInput;
}

export namespace ConversationInput {
    export type AsObject = {
        content: string,
        role?: string,
        scrubpii?: boolean,
    }
}

export class ConversationInputAlpha2 extends jspb.Message { 
    clearMessagesList(): void;
    getMessagesList(): Array<ConversationMessage>;
    setMessagesList(value: Array<ConversationMessage>): ConversationInputAlpha2;
    addMessages(value?: ConversationMessage, index?: number): ConversationMessage;

    hasScrubPii(): boolean;
    clearScrubPii(): void;
    getScrubPii(): boolean | undefined;
    setScrubPii(value: boolean): ConversationInputAlpha2;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationInputAlpha2.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationInputAlpha2): ConversationInputAlpha2.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationInputAlpha2, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationInputAlpha2;
    static deserializeBinaryFromReader(message: ConversationInputAlpha2, reader: jspb.BinaryReader): ConversationInputAlpha2;
}

export namespace ConversationInputAlpha2 {
    export type AsObject = {
        messagesList: Array<ConversationMessage.AsObject>,
        scrubPii?: boolean,
    }
}

export class ConversationMessage extends jspb.Message { 

    hasOfDeveloper(): boolean;
    clearOfDeveloper(): void;
    getOfDeveloper(): ConversationMessageOfDeveloper | undefined;
    setOfDeveloper(value?: ConversationMessageOfDeveloper): ConversationMessage;

    hasOfSystem(): boolean;
    clearOfSystem(): void;
    getOfSystem(): ConversationMessageOfSystem | undefined;
    setOfSystem(value?: ConversationMessageOfSystem): ConversationMessage;

    hasOfUser(): boolean;
    clearOfUser(): void;
    getOfUser(): ConversationMessageOfUser | undefined;
    setOfUser(value?: ConversationMessageOfUser): ConversationMessage;

    hasOfAssistant(): boolean;
    clearOfAssistant(): void;
    getOfAssistant(): ConversationMessageOfAssistant | undefined;
    setOfAssistant(value?: ConversationMessageOfAssistant): ConversationMessage;

    hasOfTool(): boolean;
    clearOfTool(): void;
    getOfTool(): ConversationMessageOfTool | undefined;
    setOfTool(value?: ConversationMessageOfTool): ConversationMessage;

    getMessageTypesCase(): ConversationMessage.MessageTypesCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationMessage.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationMessage): ConversationMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationMessage;
    static deserializeBinaryFromReader(message: ConversationMessage, reader: jspb.BinaryReader): ConversationMessage;
}

export namespace ConversationMessage {
    export type AsObject = {
        ofDeveloper?: ConversationMessageOfDeveloper.AsObject,
        ofSystem?: ConversationMessageOfSystem.AsObject,
        ofUser?: ConversationMessageOfUser.AsObject,
        ofAssistant?: ConversationMessageOfAssistant.AsObject,
        ofTool?: ConversationMessageOfTool.AsObject,
    }

    export enum MessageTypesCase {
        MESSAGE_TYPES_NOT_SET = 0,
        OF_DEVELOPER = 1,
        OF_SYSTEM = 2,
        OF_USER = 3,
        OF_ASSISTANT = 4,
        OF_TOOL = 5,
    }

}

export class ConversationMessageOfDeveloper extends jspb.Message { 

    hasName(): boolean;
    clearName(): void;
    getName(): string | undefined;
    setName(value: string): ConversationMessageOfDeveloper;
    clearContentList(): void;
    getContentList(): Array<ConversationMessageContent>;
    setContentList(value: Array<ConversationMessageContent>): ConversationMessageOfDeveloper;
    addContent(value?: ConversationMessageContent, index?: number): ConversationMessageContent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationMessageOfDeveloper.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationMessageOfDeveloper): ConversationMessageOfDeveloper.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationMessageOfDeveloper, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationMessageOfDeveloper;
    static deserializeBinaryFromReader(message: ConversationMessageOfDeveloper, reader: jspb.BinaryReader): ConversationMessageOfDeveloper;
}

export namespace ConversationMessageOfDeveloper {
    export type AsObject = {
        name?: string,
        contentList: Array<ConversationMessageContent.AsObject>,
    }
}

export class ConversationMessageOfSystem extends jspb.Message { 

    hasName(): boolean;
    clearName(): void;
    getName(): string | undefined;
    setName(value: string): ConversationMessageOfSystem;
    clearContentList(): void;
    getContentList(): Array<ConversationMessageContent>;
    setContentList(value: Array<ConversationMessageContent>): ConversationMessageOfSystem;
    addContent(value?: ConversationMessageContent, index?: number): ConversationMessageContent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationMessageOfSystem.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationMessageOfSystem): ConversationMessageOfSystem.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationMessageOfSystem, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationMessageOfSystem;
    static deserializeBinaryFromReader(message: ConversationMessageOfSystem, reader: jspb.BinaryReader): ConversationMessageOfSystem;
}

export namespace ConversationMessageOfSystem {
    export type AsObject = {
        name?: string,
        contentList: Array<ConversationMessageContent.AsObject>,
    }
}

export class ConversationMessageOfUser extends jspb.Message { 

    hasName(): boolean;
    clearName(): void;
    getName(): string | undefined;
    setName(value: string): ConversationMessageOfUser;
    clearContentList(): void;
    getContentList(): Array<ConversationMessageContent>;
    setContentList(value: Array<ConversationMessageContent>): ConversationMessageOfUser;
    addContent(value?: ConversationMessageContent, index?: number): ConversationMessageContent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationMessageOfUser.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationMessageOfUser): ConversationMessageOfUser.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationMessageOfUser, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationMessageOfUser;
    static deserializeBinaryFromReader(message: ConversationMessageOfUser, reader: jspb.BinaryReader): ConversationMessageOfUser;
}

export namespace ConversationMessageOfUser {
    export type AsObject = {
        name?: string,
        contentList: Array<ConversationMessageContent.AsObject>,
    }
}

export class ConversationMessageOfAssistant extends jspb.Message { 

    hasName(): boolean;
    clearName(): void;
    getName(): string | undefined;
    setName(value: string): ConversationMessageOfAssistant;
    clearContentList(): void;
    getContentList(): Array<ConversationMessageContent>;
    setContentList(value: Array<ConversationMessageContent>): ConversationMessageOfAssistant;
    addContent(value?: ConversationMessageContent, index?: number): ConversationMessageContent;
    clearToolCallsList(): void;
    getToolCallsList(): Array<ConversationToolCalls>;
    setToolCallsList(value: Array<ConversationToolCalls>): ConversationMessageOfAssistant;
    addToolCalls(value?: ConversationToolCalls, index?: number): ConversationToolCalls;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationMessageOfAssistant.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationMessageOfAssistant): ConversationMessageOfAssistant.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationMessageOfAssistant, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationMessageOfAssistant;
    static deserializeBinaryFromReader(message: ConversationMessageOfAssistant, reader: jspb.BinaryReader): ConversationMessageOfAssistant;
}

export namespace ConversationMessageOfAssistant {
    export type AsObject = {
        name?: string,
        contentList: Array<ConversationMessageContent.AsObject>,
        toolCallsList: Array<ConversationToolCalls.AsObject>,
    }
}

export class ConversationMessageOfTool extends jspb.Message { 

    hasToolId(): boolean;
    clearToolId(): void;
    getToolId(): string | undefined;
    setToolId(value: string): ConversationMessageOfTool;
    getName(): string;
    setName(value: string): ConversationMessageOfTool;
    clearContentList(): void;
    getContentList(): Array<ConversationMessageContent>;
    setContentList(value: Array<ConversationMessageContent>): ConversationMessageOfTool;
    addContent(value?: ConversationMessageContent, index?: number): ConversationMessageContent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationMessageOfTool.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationMessageOfTool): ConversationMessageOfTool.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationMessageOfTool, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationMessageOfTool;
    static deserializeBinaryFromReader(message: ConversationMessageOfTool, reader: jspb.BinaryReader): ConversationMessageOfTool;
}

export namespace ConversationMessageOfTool {
    export type AsObject = {
        toolId?: string,
        name: string,
        contentList: Array<ConversationMessageContent.AsObject>,
    }
}

export class ConversationToolCalls extends jspb.Message { 

    hasId(): boolean;
    clearId(): void;
    getId(): string | undefined;
    setId(value: string): ConversationToolCalls;

    hasFunction(): boolean;
    clearFunction(): void;
    getFunction(): ConversationToolCallsOfFunction | undefined;
    setFunction(value?: ConversationToolCallsOfFunction): ConversationToolCalls;

    getToolTypesCase(): ConversationToolCalls.ToolTypesCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationToolCalls.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationToolCalls): ConversationToolCalls.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationToolCalls, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationToolCalls;
    static deserializeBinaryFromReader(message: ConversationToolCalls, reader: jspb.BinaryReader): ConversationToolCalls;
}

export namespace ConversationToolCalls {
    export type AsObject = {
        id?: string,
        pb_function?: ConversationToolCallsOfFunction.AsObject,
    }

    export enum ToolTypesCase {
        TOOL_TYPES_NOT_SET = 0,
        FUNCTION = 2,
    }

}

export class ConversationToolCallsOfFunction extends jspb.Message { 
    getName(): string;
    setName(value: string): ConversationToolCallsOfFunction;
    getArguments(): string;
    setArguments(value: string): ConversationToolCallsOfFunction;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationToolCallsOfFunction.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationToolCallsOfFunction): ConversationToolCallsOfFunction.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationToolCallsOfFunction, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationToolCallsOfFunction;
    static deserializeBinaryFromReader(message: ConversationToolCallsOfFunction, reader: jspb.BinaryReader): ConversationToolCallsOfFunction;
}

export namespace ConversationToolCallsOfFunction {
    export type AsObject = {
        name: string,
        arguments: string,
    }
}

export class ConversationMessageContent extends jspb.Message { 
    getText(): string;
    setText(value: string): ConversationMessageContent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationMessageContent.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationMessageContent): ConversationMessageContent.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationMessageContent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationMessageContent;
    static deserializeBinaryFromReader(message: ConversationMessageContent, reader: jspb.BinaryReader): ConversationMessageContent;
}

export namespace ConversationMessageContent {
    export type AsObject = {
        text: string,
    }
}

export class ConversationResult extends jspb.Message { 
    getResult(): string;
    setResult(value: string): ConversationResult;

    getParametersMap(): jspb.Map<string, google_protobuf_any_pb.Any>;
    clearParametersMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationResult.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationResult): ConversationResult.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationResult, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationResult;
    static deserializeBinaryFromReader(message: ConversationResult, reader: jspb.BinaryReader): ConversationResult;
}

export namespace ConversationResult {
    export type AsObject = {
        result: string,

        parametersMap: Array<[string, google_protobuf_any_pb.Any.AsObject]>,
    }
}

export class ConversationResultAlpha2 extends jspb.Message { 
    clearChoicesList(): void;
    getChoicesList(): Array<ConversationResultChoices>;
    setChoicesList(value: Array<ConversationResultChoices>): ConversationResultAlpha2;
    addChoices(value?: ConversationResultChoices, index?: number): ConversationResultChoices;

    hasModel(): boolean;
    clearModel(): void;
    getModel(): string | undefined;
    setModel(value: string): ConversationResultAlpha2;

    hasUsage(): boolean;
    clearUsage(): void;
    getUsage(): ConversationResultAlpha2CompletionUsage | undefined;
    setUsage(value?: ConversationResultAlpha2CompletionUsage): ConversationResultAlpha2;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationResultAlpha2.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationResultAlpha2): ConversationResultAlpha2.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationResultAlpha2, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationResultAlpha2;
    static deserializeBinaryFromReader(message: ConversationResultAlpha2, reader: jspb.BinaryReader): ConversationResultAlpha2;
}

export namespace ConversationResultAlpha2 {
    export type AsObject = {
        choicesList: Array<ConversationResultChoices.AsObject>,
        model?: string,
        usage?: ConversationResultAlpha2CompletionUsage.AsObject,
    }
}

export class ConversationResultAlpha2CompletionUsage extends jspb.Message { 
    getCompletionTokens(): number;
    setCompletionTokens(value: number): ConversationResultAlpha2CompletionUsage;
    getPromptTokens(): number;
    setPromptTokens(value: number): ConversationResultAlpha2CompletionUsage;
    getTotalTokens(): number;
    setTotalTokens(value: number): ConversationResultAlpha2CompletionUsage;

    hasCompletionTokensDetails(): boolean;
    clearCompletionTokensDetails(): void;
    getCompletionTokensDetails(): ConversationResultAlpha2CompletionUsageCompletionTokensDetails | undefined;
    setCompletionTokensDetails(value?: ConversationResultAlpha2CompletionUsageCompletionTokensDetails): ConversationResultAlpha2CompletionUsage;

    hasPromptTokensDetails(): boolean;
    clearPromptTokensDetails(): void;
    getPromptTokensDetails(): ConversationResultAlpha2CompletionUsagePromptTokensDetails | undefined;
    setPromptTokensDetails(value?: ConversationResultAlpha2CompletionUsagePromptTokensDetails): ConversationResultAlpha2CompletionUsage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationResultAlpha2CompletionUsage.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationResultAlpha2CompletionUsage): ConversationResultAlpha2CompletionUsage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationResultAlpha2CompletionUsage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationResultAlpha2CompletionUsage;
    static deserializeBinaryFromReader(message: ConversationResultAlpha2CompletionUsage, reader: jspb.BinaryReader): ConversationResultAlpha2CompletionUsage;
}

export namespace ConversationResultAlpha2CompletionUsage {
    export type AsObject = {
        completionTokens: number,
        promptTokens: number,
        totalTokens: number,
        completionTokensDetails?: ConversationResultAlpha2CompletionUsageCompletionTokensDetails.AsObject,
        promptTokensDetails?: ConversationResultAlpha2CompletionUsagePromptTokensDetails.AsObject,
    }
}

export class ConversationResultAlpha2CompletionUsageCompletionTokensDetails extends jspb.Message { 
    getAcceptedPredictionTokens(): number;
    setAcceptedPredictionTokens(value: number): ConversationResultAlpha2CompletionUsageCompletionTokensDetails;
    getAudioTokens(): number;
    setAudioTokens(value: number): ConversationResultAlpha2CompletionUsageCompletionTokensDetails;
    getReasoningTokens(): number;
    setReasoningTokens(value: number): ConversationResultAlpha2CompletionUsageCompletionTokensDetails;
    getRejectedPredictionTokens(): number;
    setRejectedPredictionTokens(value: number): ConversationResultAlpha2CompletionUsageCompletionTokensDetails;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationResultAlpha2CompletionUsageCompletionTokensDetails.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationResultAlpha2CompletionUsageCompletionTokensDetails): ConversationResultAlpha2CompletionUsageCompletionTokensDetails.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationResultAlpha2CompletionUsageCompletionTokensDetails, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationResultAlpha2CompletionUsageCompletionTokensDetails;
    static deserializeBinaryFromReader(message: ConversationResultAlpha2CompletionUsageCompletionTokensDetails, reader: jspb.BinaryReader): ConversationResultAlpha2CompletionUsageCompletionTokensDetails;
}

export namespace ConversationResultAlpha2CompletionUsageCompletionTokensDetails {
    export type AsObject = {
        acceptedPredictionTokens: number,
        audioTokens: number,
        reasoningTokens: number,
        rejectedPredictionTokens: number,
    }
}

export class ConversationResultAlpha2CompletionUsagePromptTokensDetails extends jspb.Message { 
    getAudioTokens(): number;
    setAudioTokens(value: number): ConversationResultAlpha2CompletionUsagePromptTokensDetails;
    getCachedTokens(): number;
    setCachedTokens(value: number): ConversationResultAlpha2CompletionUsagePromptTokensDetails;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationResultAlpha2CompletionUsagePromptTokensDetails.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationResultAlpha2CompletionUsagePromptTokensDetails): ConversationResultAlpha2CompletionUsagePromptTokensDetails.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationResultAlpha2CompletionUsagePromptTokensDetails, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationResultAlpha2CompletionUsagePromptTokensDetails;
    static deserializeBinaryFromReader(message: ConversationResultAlpha2CompletionUsagePromptTokensDetails, reader: jspb.BinaryReader): ConversationResultAlpha2CompletionUsagePromptTokensDetails;
}

export namespace ConversationResultAlpha2CompletionUsagePromptTokensDetails {
    export type AsObject = {
        audioTokens: number,
        cachedTokens: number,
    }
}

export class ConversationResultChoices extends jspb.Message { 
    getFinishReason(): string;
    setFinishReason(value: string): ConversationResultChoices;
    getIndex(): number;
    setIndex(value: number): ConversationResultChoices;

    hasMessage(): boolean;
    clearMessage(): void;
    getMessage(): ConversationResultMessage | undefined;
    setMessage(value?: ConversationResultMessage): ConversationResultChoices;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationResultChoices.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationResultChoices): ConversationResultChoices.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationResultChoices, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationResultChoices;
    static deserializeBinaryFromReader(message: ConversationResultChoices, reader: jspb.BinaryReader): ConversationResultChoices;
}

export namespace ConversationResultChoices {
    export type AsObject = {
        finishReason: string,
        index: number,
        message?: ConversationResultMessage.AsObject,
    }
}

export class ConversationResultMessage extends jspb.Message { 
    getContent(): string;
    setContent(value: string): ConversationResultMessage;
    clearToolCallsList(): void;
    getToolCallsList(): Array<ConversationToolCalls>;
    setToolCallsList(value: Array<ConversationToolCalls>): ConversationResultMessage;
    addToolCalls(value?: ConversationToolCalls, index?: number): ConversationToolCalls;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationResultMessage.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationResultMessage): ConversationResultMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationResultMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationResultMessage;
    static deserializeBinaryFromReader(message: ConversationResultMessage, reader: jspb.BinaryReader): ConversationResultMessage;
}

export namespace ConversationResultMessage {
    export type AsObject = {
        content: string,
        toolCallsList: Array<ConversationToolCalls.AsObject>,
    }
}

export class ConversationResponse extends jspb.Message { 

    hasContextid(): boolean;
    clearContextid(): void;
    getContextid(): string | undefined;
    setContextid(value: string): ConversationResponse;
    clearOutputsList(): void;
    getOutputsList(): Array<ConversationResult>;
    setOutputsList(value: Array<ConversationResult>): ConversationResponse;
    addOutputs(value?: ConversationResult, index?: number): ConversationResult;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationResponse): ConversationResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationResponse;
    static deserializeBinaryFromReader(message: ConversationResponse, reader: jspb.BinaryReader): ConversationResponse;
}

export namespace ConversationResponse {
    export type AsObject = {
        contextid?: string,
        outputsList: Array<ConversationResult.AsObject>,
    }
}

export class ConversationResponseAlpha2 extends jspb.Message { 

    hasContextId(): boolean;
    clearContextId(): void;
    getContextId(): string | undefined;
    setContextId(value: string): ConversationResponseAlpha2;
    clearOutputsList(): void;
    getOutputsList(): Array<ConversationResultAlpha2>;
    setOutputsList(value: Array<ConversationResultAlpha2>): ConversationResponseAlpha2;
    addOutputs(value?: ConversationResultAlpha2, index?: number): ConversationResultAlpha2;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationResponseAlpha2.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationResponseAlpha2): ConversationResponseAlpha2.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationResponseAlpha2, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationResponseAlpha2;
    static deserializeBinaryFromReader(message: ConversationResponseAlpha2, reader: jspb.BinaryReader): ConversationResponseAlpha2;
}

export namespace ConversationResponseAlpha2 {
    export type AsObject = {
        contextId?: string,
        outputsList: Array<ConversationResultAlpha2.AsObject>,
    }
}

export class ConversationTools extends jspb.Message { 

    hasFunction(): boolean;
    clearFunction(): void;
    getFunction(): ConversationToolsFunction | undefined;
    setFunction(value?: ConversationToolsFunction): ConversationTools;

    getToolTypesCase(): ConversationTools.ToolTypesCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationTools.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationTools): ConversationTools.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationTools, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationTools;
    static deserializeBinaryFromReader(message: ConversationTools, reader: jspb.BinaryReader): ConversationTools;
}

export namespace ConversationTools {
    export type AsObject = {
        pb_function?: ConversationToolsFunction.AsObject,
    }

    export enum ToolTypesCase {
        TOOL_TYPES_NOT_SET = 0,
        FUNCTION = 1,
    }

}

export class ConversationToolsFunction extends jspb.Message { 
    getName(): string;
    setName(value: string): ConversationToolsFunction;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): ConversationToolsFunction;

    hasParameters(): boolean;
    clearParameters(): void;
    getParameters(): google_protobuf_struct_pb.Struct | undefined;
    setParameters(value?: google_protobuf_struct_pb.Struct): ConversationToolsFunction;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConversationToolsFunction.AsObject;
    static toObject(includeInstance: boolean, msg: ConversationToolsFunction): ConversationToolsFunction.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConversationToolsFunction, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConversationToolsFunction;
    static deserializeBinaryFromReader(message: ConversationToolsFunction, reader: jspb.BinaryReader): ConversationToolsFunction;
}

export namespace ConversationToolsFunction {
    export type AsObject = {
        name: string,
        description?: string,
        parameters?: google_protobuf_struct_pb.Struct.AsObject,
    }
}
