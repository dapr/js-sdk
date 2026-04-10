// package: dapr.proto.runtime.v1
// file: dapr/proto/runtime/v1/metadata.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class GetMetadataRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetMetadataRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetMetadataRequest): GetMetadataRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetMetadataRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetMetadataRequest;
    static deserializeBinaryFromReader(message: GetMetadataRequest, reader: jspb.BinaryReader): GetMetadataRequest;
}

export namespace GetMetadataRequest {
    export type AsObject = {
    }
}

export class GetMetadataResponse extends jspb.Message { 
    getId(): string;
    setId(value: string): GetMetadataResponse;
    clearActiveActorsCountList(): void;
    getActiveActorsCountList(): Array<ActiveActorsCount>;
    setActiveActorsCountList(value: Array<ActiveActorsCount>): GetMetadataResponse;
    addActiveActorsCount(value?: ActiveActorsCount, index?: number): ActiveActorsCount;
    clearRegisteredComponentsList(): void;
    getRegisteredComponentsList(): Array<RegisteredComponents>;
    setRegisteredComponentsList(value: Array<RegisteredComponents>): GetMetadataResponse;
    addRegisteredComponents(value?: RegisteredComponents, index?: number): RegisteredComponents;

    getExtendedMetadataMap(): jspb.Map<string, string>;
    clearExtendedMetadataMap(): void;
    clearSubscriptionsList(): void;
    getSubscriptionsList(): Array<PubsubSubscription>;
    setSubscriptionsList(value: Array<PubsubSubscription>): GetMetadataResponse;
    addSubscriptions(value?: PubsubSubscription, index?: number): PubsubSubscription;
    clearHttpEndpointsList(): void;
    getHttpEndpointsList(): Array<MetadataHTTPEndpoint>;
    setHttpEndpointsList(value: Array<MetadataHTTPEndpoint>): GetMetadataResponse;
    addHttpEndpoints(value?: MetadataHTTPEndpoint, index?: number): MetadataHTTPEndpoint;

    hasAppConnectionProperties(): boolean;
    clearAppConnectionProperties(): void;
    getAppConnectionProperties(): AppConnectionProperties | undefined;
    setAppConnectionProperties(value?: AppConnectionProperties): GetMetadataResponse;
    getRuntimeVersion(): string;
    setRuntimeVersion(value: string): GetMetadataResponse;
    clearEnabledFeaturesList(): void;
    getEnabledFeaturesList(): Array<string>;
    setEnabledFeaturesList(value: Array<string>): GetMetadataResponse;
    addEnabledFeatures(value: string, index?: number): string;

    hasActorRuntime(): boolean;
    clearActorRuntime(): void;
    getActorRuntime(): ActorRuntime | undefined;
    setActorRuntime(value?: ActorRuntime): GetMetadataResponse;

    hasScheduler(): boolean;
    clearScheduler(): void;
    getScheduler(): MetadataScheduler | undefined;
    setScheduler(value?: MetadataScheduler): GetMetadataResponse;

    hasWorkflows(): boolean;
    clearWorkflows(): void;
    getWorkflows(): MetadataWorkflows | undefined;
    setWorkflows(value?: MetadataWorkflows): GetMetadataResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetMetadataResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetMetadataResponse): GetMetadataResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetMetadataResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetMetadataResponse;
    static deserializeBinaryFromReader(message: GetMetadataResponse, reader: jspb.BinaryReader): GetMetadataResponse;
}

export namespace GetMetadataResponse {
    export type AsObject = {
        id: string,
        activeActorsCountList: Array<ActiveActorsCount.AsObject>,
        registeredComponentsList: Array<RegisteredComponents.AsObject>,

        extendedMetadataMap: Array<[string, string]>,
        subscriptionsList: Array<PubsubSubscription.AsObject>,
        httpEndpointsList: Array<MetadataHTTPEndpoint.AsObject>,
        appConnectionProperties?: AppConnectionProperties.AsObject,
        runtimeVersion: string,
        enabledFeaturesList: Array<string>,
        actorRuntime?: ActorRuntime.AsObject,
        scheduler?: MetadataScheduler.AsObject,
        workflows?: MetadataWorkflows.AsObject,
    }
}

export class MetadataWorkflows extends jspb.Message { 
    getConnectedWorkers(): number;
    setConnectedWorkers(value: number): MetadataWorkflows;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MetadataWorkflows.AsObject;
    static toObject(includeInstance: boolean, msg: MetadataWorkflows): MetadataWorkflows.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MetadataWorkflows, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MetadataWorkflows;
    static deserializeBinaryFromReader(message: MetadataWorkflows, reader: jspb.BinaryReader): MetadataWorkflows;
}

export namespace MetadataWorkflows {
    export type AsObject = {
        connectedWorkers: number,
    }
}

export class MetadataScheduler extends jspb.Message { 
    clearConnectedAddressesList(): void;
    getConnectedAddressesList(): Array<string>;
    setConnectedAddressesList(value: Array<string>): MetadataScheduler;
    addConnectedAddresses(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MetadataScheduler.AsObject;
    static toObject(includeInstance: boolean, msg: MetadataScheduler): MetadataScheduler.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MetadataScheduler, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MetadataScheduler;
    static deserializeBinaryFromReader(message: MetadataScheduler, reader: jspb.BinaryReader): MetadataScheduler;
}

export namespace MetadataScheduler {
    export type AsObject = {
        connectedAddressesList: Array<string>,
    }
}

export class ActorRuntime extends jspb.Message { 
    getRuntimeStatus(): ActorRuntime.ActorRuntimeStatus;
    setRuntimeStatus(value: ActorRuntime.ActorRuntimeStatus): ActorRuntime;
    clearActiveActorsList(): void;
    getActiveActorsList(): Array<ActiveActorsCount>;
    setActiveActorsList(value: Array<ActiveActorsCount>): ActorRuntime;
    addActiveActors(value?: ActiveActorsCount, index?: number): ActiveActorsCount;
    getHostReady(): boolean;
    setHostReady(value: boolean): ActorRuntime;
    getPlacement(): string;
    setPlacement(value: string): ActorRuntime;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ActorRuntime.AsObject;
    static toObject(includeInstance: boolean, msg: ActorRuntime): ActorRuntime.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ActorRuntime, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ActorRuntime;
    static deserializeBinaryFromReader(message: ActorRuntime, reader: jspb.BinaryReader): ActorRuntime;
}

export namespace ActorRuntime {
    export type AsObject = {
        runtimeStatus: ActorRuntime.ActorRuntimeStatus,
        activeActorsList: Array<ActiveActorsCount.AsObject>,
        hostReady: boolean,
        placement: string,
    }

    export enum ActorRuntimeStatus {
    INITIALIZING = 0,
    DISABLED = 1,
    RUNNING = 2,
    }

}

export class ActiveActorsCount extends jspb.Message { 
    getType(): string;
    setType(value: string): ActiveActorsCount;
    getCount(): number;
    setCount(value: number): ActiveActorsCount;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ActiveActorsCount.AsObject;
    static toObject(includeInstance: boolean, msg: ActiveActorsCount): ActiveActorsCount.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ActiveActorsCount, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ActiveActorsCount;
    static deserializeBinaryFromReader(message: ActiveActorsCount, reader: jspb.BinaryReader): ActiveActorsCount;
}

export namespace ActiveActorsCount {
    export type AsObject = {
        type: string,
        count: number,
    }
}

export class RegisteredComponents extends jspb.Message { 
    getName(): string;
    setName(value: string): RegisteredComponents;
    getType(): string;
    setType(value: string): RegisteredComponents;
    getVersion(): string;
    setVersion(value: string): RegisteredComponents;
    clearCapabilitiesList(): void;
    getCapabilitiesList(): Array<string>;
    setCapabilitiesList(value: Array<string>): RegisteredComponents;
    addCapabilities(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RegisteredComponents.AsObject;
    static toObject(includeInstance: boolean, msg: RegisteredComponents): RegisteredComponents.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RegisteredComponents, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RegisteredComponents;
    static deserializeBinaryFromReader(message: RegisteredComponents, reader: jspb.BinaryReader): RegisteredComponents;
}

export namespace RegisteredComponents {
    export type AsObject = {
        name: string,
        type: string,
        version: string,
        capabilitiesList: Array<string>,
    }
}

export class MetadataHTTPEndpoint extends jspb.Message { 
    getName(): string;
    setName(value: string): MetadataHTTPEndpoint;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MetadataHTTPEndpoint.AsObject;
    static toObject(includeInstance: boolean, msg: MetadataHTTPEndpoint): MetadataHTTPEndpoint.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MetadataHTTPEndpoint, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MetadataHTTPEndpoint;
    static deserializeBinaryFromReader(message: MetadataHTTPEndpoint, reader: jspb.BinaryReader): MetadataHTTPEndpoint;
}

export namespace MetadataHTTPEndpoint {
    export type AsObject = {
        name: string,
    }
}

export class AppConnectionProperties extends jspb.Message { 
    getPort(): number;
    setPort(value: number): AppConnectionProperties;
    getProtocol(): string;
    setProtocol(value: string): AppConnectionProperties;
    getChannelAddress(): string;
    setChannelAddress(value: string): AppConnectionProperties;
    getMaxConcurrency(): number;
    setMaxConcurrency(value: number): AppConnectionProperties;

    hasHealth(): boolean;
    clearHealth(): void;
    getHealth(): AppConnectionHealthProperties | undefined;
    setHealth(value?: AppConnectionHealthProperties): AppConnectionProperties;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AppConnectionProperties.AsObject;
    static toObject(includeInstance: boolean, msg: AppConnectionProperties): AppConnectionProperties.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AppConnectionProperties, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AppConnectionProperties;
    static deserializeBinaryFromReader(message: AppConnectionProperties, reader: jspb.BinaryReader): AppConnectionProperties;
}

export namespace AppConnectionProperties {
    export type AsObject = {
        port: number,
        protocol: string,
        channelAddress: string,
        maxConcurrency: number,
        health?: AppConnectionHealthProperties.AsObject,
    }
}

export class AppConnectionHealthProperties extends jspb.Message { 
    getHealthCheckPath(): string;
    setHealthCheckPath(value: string): AppConnectionHealthProperties;
    getHealthProbeInterval(): string;
    setHealthProbeInterval(value: string): AppConnectionHealthProperties;
    getHealthProbeTimeout(): string;
    setHealthProbeTimeout(value: string): AppConnectionHealthProperties;
    getHealthThreshold(): number;
    setHealthThreshold(value: number): AppConnectionHealthProperties;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AppConnectionHealthProperties.AsObject;
    static toObject(includeInstance: boolean, msg: AppConnectionHealthProperties): AppConnectionHealthProperties.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AppConnectionHealthProperties, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AppConnectionHealthProperties;
    static deserializeBinaryFromReader(message: AppConnectionHealthProperties, reader: jspb.BinaryReader): AppConnectionHealthProperties;
}

export namespace AppConnectionHealthProperties {
    export type AsObject = {
        healthCheckPath: string,
        healthProbeInterval: string,
        healthProbeTimeout: string,
        healthThreshold: number,
    }
}

export class PubsubSubscription extends jspb.Message { 
    getPubsubName(): string;
    setPubsubName(value: string): PubsubSubscription;
    getTopic(): string;
    setTopic(value: string): PubsubSubscription;

    getMetadataMap(): jspb.Map<string, string>;
    clearMetadataMap(): void;

    hasRules(): boolean;
    clearRules(): void;
    getRules(): PubsubSubscriptionRules | undefined;
    setRules(value?: PubsubSubscriptionRules): PubsubSubscription;
    getDeadLetterTopic(): string;
    setDeadLetterTopic(value: string): PubsubSubscription;
    getType(): PubsubSubscriptionType;
    setType(value: PubsubSubscriptionType): PubsubSubscription;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PubsubSubscription.AsObject;
    static toObject(includeInstance: boolean, msg: PubsubSubscription): PubsubSubscription.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PubsubSubscription, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PubsubSubscription;
    static deserializeBinaryFromReader(message: PubsubSubscription, reader: jspb.BinaryReader): PubsubSubscription;
}

export namespace PubsubSubscription {
    export type AsObject = {
        pubsubName: string,
        topic: string,

        metadataMap: Array<[string, string]>,
        rules?: PubsubSubscriptionRules.AsObject,
        deadLetterTopic: string,
        type: PubsubSubscriptionType,
    }
}

export class PubsubSubscriptionRules extends jspb.Message { 
    clearRulesList(): void;
    getRulesList(): Array<PubsubSubscriptionRule>;
    setRulesList(value: Array<PubsubSubscriptionRule>): PubsubSubscriptionRules;
    addRules(value?: PubsubSubscriptionRule, index?: number): PubsubSubscriptionRule;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PubsubSubscriptionRules.AsObject;
    static toObject(includeInstance: boolean, msg: PubsubSubscriptionRules): PubsubSubscriptionRules.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PubsubSubscriptionRules, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PubsubSubscriptionRules;
    static deserializeBinaryFromReader(message: PubsubSubscriptionRules, reader: jspb.BinaryReader): PubsubSubscriptionRules;
}

export namespace PubsubSubscriptionRules {
    export type AsObject = {
        rulesList: Array<PubsubSubscriptionRule.AsObject>,
    }
}

export class PubsubSubscriptionRule extends jspb.Message { 
    getMatch(): string;
    setMatch(value: string): PubsubSubscriptionRule;
    getPath(): string;
    setPath(value: string): PubsubSubscriptionRule;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PubsubSubscriptionRule.AsObject;
    static toObject(includeInstance: boolean, msg: PubsubSubscriptionRule): PubsubSubscriptionRule.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PubsubSubscriptionRule, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PubsubSubscriptionRule;
    static deserializeBinaryFromReader(message: PubsubSubscriptionRule, reader: jspb.BinaryReader): PubsubSubscriptionRule;
}

export namespace PubsubSubscriptionRule {
    export type AsObject = {
        match: string,
        path: string,
    }
}

export class SetMetadataRequest extends jspb.Message { 
    getKey(): string;
    setKey(value: string): SetMetadataRequest;
    getValue(): string;
    setValue(value: string): SetMetadataRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetMetadataRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SetMetadataRequest): SetMetadataRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetMetadataRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetMetadataRequest;
    static deserializeBinaryFromReader(message: SetMetadataRequest, reader: jspb.BinaryReader): SetMetadataRequest;
}

export namespace SetMetadataRequest {
    export type AsObject = {
        key: string,
        value: string,
    }
}

export enum PubsubSubscriptionType {
    UNKNOWN = 0,
    DECLARATIVE = 1,
    PROGRAMMATIC = 2,
    STREAMING = 3,
}
