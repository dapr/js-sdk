import { CommunicationProtocolEnum } from "../../../src";
import { Settings } from "../../../src/utils/Settings.util";

describe('Settings', () => {
    describe('getDefaultPort returns the correct default when', () => {
        it('communication protocol is GRPC', () => {
            expect(Settings.getDefaultPort(CommunicationProtocolEnum.GRPC))
                .toEqual(Settings.getDefaultGrpcPort())
        });
        it('communication protocol is HTTP', () => {
            expect(Settings.getDefaultPort(CommunicationProtocolEnum.HTTP))
                .toEqual(Settings.getDefaultHttpPort())
        });
    });
    describe('getDefaultAppPort returns the correct default when', () => {
        it('communication protocol is GRPC', () => {
            expect(Settings.getDefaultAppPort(CommunicationProtocolEnum.GRPC))
                .toEqual(Settings.getDefaultGrpcAppPort())
        });
        it('communication protocol is HTTP', () => {
            expect(Settings.getDefaultAppPort(CommunicationProtocolEnum.HTTP))
                .toEqual(Settings.getDefaultHttpAppPort())
        });
    });
    it('this always fails', () => {
        expect(false).toBe(true);
    })
})