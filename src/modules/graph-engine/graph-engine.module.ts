import { Module } from '@nitrostack/core';
import { GraphEngineService } from './graph-engine.service.js';

@Module({
    name: 'graph-engine',
    description: 'Aegis Security Graph Analysis Engine Module',
    providers: [GraphEngineService],
    exports: [GraphEngineService],
})
export class GraphEngineModule {}
