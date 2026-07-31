import { Module } from '@nitrostack/core';
import { PolicyEngineService } from './policy-engine.service.js';

@Module({
    name: 'policy-engine',
    description: 'Aegis Security Policy Enforcement Engine Module',
    providers: [PolicyEngineService],
    exports: [PolicyEngineService],
})
export class PolicyEngineModule {}
