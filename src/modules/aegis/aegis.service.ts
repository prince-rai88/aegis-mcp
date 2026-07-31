import { Injectable } from '@nitrostack/core';
import { CapabilityEngineService } from '../capability-engine/capability-engine.service.js';
import { GraphEngineService } from '../graph-engine/graph-engine.service.js';
import { RiskEngineService } from '../risk-engine/risk-engine.service.js';
import { PolicyEngineService } from '../policy-engine/policy-engine.service.js';
import { AEGIS_NODES, type AegisNode } from './aegis.data.js';

@Injectable({
    deps: [
        CapabilityEngineService,
        GraphEngineService,
        RiskEngineService,
        PolicyEngineService,
    ]
})
export class AegisService {
    constructor(
        private readonly capabilityEngine: CapabilityEngineService,
        private readonly graphEngine: GraphEngineService,
        private readonly riskEngine: RiskEngineService,
        private readonly policyEngine: PolicyEngineService
    ) {}

    /**
     * Get all Aegis capability nodes
     */
    getAllNodes(): AegisNode[] {
        return AEGIS_NODES;
    }

    /**
     * Get a specific node by ID
     */
    getNodeById(id: string): AegisNode | undefined {
        return AEGIS_NODES.find(node => node.id === id);
    }

    /**
     * Get nodes filtered by parameters
     */
    getNodesFiltered(filters: {
        openNow?: boolean;
        minRating?: number;
        maxPrice?: number; // Conceptually maximum threat level (1 to 3)
        cuisine?: string; // Conceptually category
    }): AegisNode[] {
        let nodes = [...AEGIS_NODES];

        if (filters.openNow) {
            nodes = nodes.filter(node => node.openNow);
        }

        if (filters.minRating !== undefined) {
            nodes = nodes.filter(node => node.rating >= filters.minRating!);
        }

        if (filters.maxPrice !== undefined) {
            nodes = nodes.filter(node => node.priceLevel <= filters.maxPrice!);
        }

        if (filters.cuisine) {
            nodes = nodes.filter(node =>
                node.cuisine.some(c => c.toLowerCase().includes(filters.cuisine!.toLowerCase()))
            );
        }

        return nodes;
    }

    /**
     * Get nodes sorted by safety rating
     */
    getTopRatedNodes(limit: number = 5): AegisNode[] {
        return [...AEGIS_NODES]
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit);
    }

    /**
     * Helper delegate methods mapping to engines for verification
     */
    getCapabilitySummary(): string[] {
        return this.capabilityEngine.getAllCapabilities();
    }

    getGraphSummary() {
        return this.graphEngine.getDependencyGraph();
    }

    getAuditSummary() {
        return this.riskEngine.auditRegisteredServers();
    }

    deployPolicy(policy: any) {
        return this.policyEngine.applyPolicy(policy);
    }
}
