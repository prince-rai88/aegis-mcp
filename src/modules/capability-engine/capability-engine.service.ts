import { Injectable } from '@nitrostack/core';

@Injectable()
export class CapabilityEngineService {
    /**
     * Get security capabilities from registered MCP servers and tools
     */
    getAllCapabilities(): string[] {
        return ['read_file', 'write_file', 'make_request', 'execute_command', 'read_env'];
    }

    /**
     * Get specialized capabilities for a specific server ID
     */
    getCapabilitiesForServer(serverId: string): string[] {
        if (serverId === 'filesystem') {
            return ['read_file', 'write_file'];
        }
        return ['read_env'];
    }
}
