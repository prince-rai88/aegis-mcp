import { McpApp, Module, ConfigModule } from '@nitrostack/core';
import { AegisModule } from './modules/aegis/aegis.module.js';

/**
 * Root Application Module
 * 
 * Aegis AI Agent Security Platform MCP Server.
 * Analyzes security capabilities and models agent safety risk paths.
 */
@McpApp({
    module: AppModule,
    server: {
        name: 'aegis-security-server',
        version: '1.0.0'
    },
    logging: {
        level: 'info'
    }
})
@Module({
    name: 'aegis',
    description: 'Aegis AI Agent Security Platform MCP Server',
    imports: [
        ConfigModule.forRoot(),
        AegisModule
    ],
})
export class AppModule { }
