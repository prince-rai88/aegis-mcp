import { Injectable } from '@nitrostack/core';

@Injectable()
export class GraphEngineService {
    /**
     * Build the dependency/attack vector graph nodes and edges
     */
    getDependencyGraph() {
        return {
            nodes: [
                { id: 'filesystem', type: 'resource' },
                { id: 'bash', type: 'execution' }
            ],
            edges: [
                { source: 'filesystem', target: 'bash', label: 'escalation_path' }
            ]
        };
    }

    /**
     * Compute if a path exists between two capabilities
     */
    getPathBetweenTools(startTool: string, endTool: string): string[] {
        return [startTool, 'intermediate-step', endTool];
    }
}
