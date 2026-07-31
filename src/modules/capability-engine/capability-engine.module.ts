import { Module } from '@nitrostack/core';
import { CapabilityEngineService } from './capability-engine.service.js';

@Module({
    name: 'capability-engine',
    description: 'Aegis Capability Analysis Engine Module',
    providers: [CapabilityEngineService],
    exports: [CapabilityEngineService],
})
export class CapabilityEngineModule {}
