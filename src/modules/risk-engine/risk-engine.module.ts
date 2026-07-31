import { Module } from '@nitrostack/core';
import { RiskEngineService } from './risk-engine.service.js';

@Module({
    name: 'risk-engine',
    description: 'Aegis Threat and Risk Evaluation Engine Module',
    providers: [RiskEngineService],
    exports: [RiskEngineService],
})
export class RiskEngineModule {}
