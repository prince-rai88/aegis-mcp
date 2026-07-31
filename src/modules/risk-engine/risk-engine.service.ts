import { Injectable } from '@nitrostack/core';

@Injectable()
export class RiskEngineService {
    /**
     * Compute a risk score based on combining capabilities
     */
    assessRiskScore(capabilities: string[]): number {
        if (capabilities.includes('execute_command') && capabilities.includes('write_file')) {
            return 95; // High Risk: Write + Code execution
        }
        return 20; // Default Low Risk
    }

    /**
     * Audit registered MCP servers and report risks
     */
    auditRegisteredServers() {
        return [
            { serverId: 'filesystem', riskScore: 40, riskLevel: 'medium' }
        ];
    }
}
