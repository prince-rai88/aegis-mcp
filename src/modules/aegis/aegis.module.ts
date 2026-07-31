import { Module } from '@nitrostack/core';
import { CapabilityEngineModule } from '../capability-engine/capability-engine.module.js';
import { GraphEngineModule } from '../graph-engine/graph-engine.module.js';
import { RiskEngineModule } from '../risk-engine/risk-engine.module.js';
import { PolicyEngineModule } from '../policy-engine/policy-engine.module.js';
import { AegisService } from './aegis.service.js';
import { AegisTools } from './aegis.tools.js';
import { AegisTaskTools } from './aegis.tasks.js';

@Module({
    name: 'aegis',
    description: 'Aegis Core Security Services and Tools Module',
    imports: [
        CapabilityEngineModule,
        GraphEngineModule,
        RiskEngineModule,
        PolicyEngineModule,
    ],
    controllers: [AegisTools, AegisTaskTools],
    providers: [AegisService],
    exports: [AegisService],
})
export class AegisModule {}
