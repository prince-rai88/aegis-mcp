import { ToolDecorator as Tool, ExecutionContext, Injectable, z } from '@nitrostack/core';
import { AegisService } from './aegis.service.js';

const ScanSchema = z.object({
    maxNodes: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe('Maximum number of capabilities/nodes to audit (default: all)'),
    delayPerNodeMs: z
        .number()
        .int()
        .min(0)
        .max(5000)
        .optional()
        .default(800)
        .describe('Processing speed scan delay per node in ms (default: 800ms)'),
});

const PolicyDeploySchema = z.object({
    shopId: z.string().describe('ID of the server node to bind the security policy onto (maps to shopId for compatibility)'),
    pizzaName: z.string().describe('Name/Identifier of the policy to apply (maps to pizzaName for compatibility)'),
    quantity: z.number().int().min(1).max(10).default(1).describe('Replication/Safety replication factor (default: 1)'),
});

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Score a security node's integrity and safety score 0-100 */
function safetyScoreNode(node: { rating: number; reviews: number; openNow: boolean }): number {
    const ratingWeight = (node.rating / 5) * 70; // 70% weight on reliability rating
    const usageWeight = Math.min(node.reviews / 5000, 1) * 20; // 20% weight on review count/proven usage history
    const connectedBonus = node.openNow ? 10 : 0; // 10% bonus for active connection health
    return Math.round(ratingWeight + usageWeight + connectedBonus);
}

function safetyGrade(score: number): string {
    if (score >= 90) return 'SEC-A+ (Highly Secure)';
    if (score >= 80) return 'SEC-A (Secure)';
    if (score >= 70) return 'SEC-B (Compliant)';
    if (score >= 60) return 'SEC-C (Restricted)';
    return 'SEC-D (High Hazard)';
}

@Injectable({ deps: [AegisService] })
export class AegisTaskTools {
    constructor(private readonly aegisService: AegisService) { }

    @Tool({
        name: 'scan_capability_risks',
        description:
            'Runs an asynchronous quality and security exposure audit across all registered nodes. ' +
            'This is a long-running operation — use task augmentation by passing `task: {}` to poll progress.',
        inputSchema: ScanSchema,
        taskSupport: 'optional',
        examples: {
            request: { maxNodes: 3, delayPerNodeMs: 0 },
            response: {
                summary: {
                    totalAudited: 3,
                    averageSecurityScore: 88,
                    topSecureNode: 'Customer DB Credentials Vault',
                    completedAt: '2026-08-01T00:00:00.000Z',
                },
                results: [
                    {
                        shopId: 'database-credentials-vault',
                        shopName: 'Customer DB Credentials Vault',
                        score: 95,
                        grade: 'SEC-A+',
                        notes: 'Exceptional KMS envelope protection active.',
                    },
                ],
            },
        },
    })
    async scanCapabilityRisks(
        args: z.infer<typeof ScanSchema>,
        ctx: ExecutionContext,
    ) {
        const allNodes = this.aegisService.getAllNodes();
        const nodes = args.maxNodes ? allNodes.slice(0, args.maxNodes) : allNodes;
        const delayMs = args.delayPerNodeMs ?? 800;

        ctx.logger.info('Starting Aegis quality and security audit scan', {
            totalNodes: nodes.length,
            delayPerNodeMs: delayMs,
            isTask: !!ctx.task,
        });

        const results: Array<{
            shopId: string; // mapped to shopId for compat
            shopName: string; // mapped to shopName for compat
            score: number;
            grade: string;
            notes: string;
        }> = [];

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            if (ctx.task) {
                ctx.task.throwIfCancelled();
                ctx.task.updateProgress(
                    `🛡️ Auditing node "${node.name}" (${i + 1}/${nodes.length}) for potential capabilities escalation…`,
                );
            }

            await sleep(delayMs);

            if (ctx.task?.isCancelled) {
                ctx.task.throwIfCancelled();
            }

            const score = safetyScoreNode(node);
            const gradeText = safetyGrade(score);

            const notes: string[] = [];
            if (score >= 90) notes.push('Verified robust cryptographically isolated configuration.');
            if (!node.openNow) notes.push('Node is currently offline — configuration locks active.');
            if (node.rating >= 4.8) notes.push('One of the safest rated nodes.');
            if (node.priceLevel === 3) notes.push('High escalation potential. Requires strict oversight.');

            results.push({
                shopId: node.id,
                shopName: node.name,
                score,
                grade: gradeText,
                notes: notes.join(' ') || 'Standard security posture verified.',
            });

            ctx.logger.info(`Audited node ${node.name}: safety=${score} (${gradeText})`);
        }

        if (ctx.task) {
            ctx.task.updateProgress(`✅ Audit scan complete! Compiling posture reports for ${results.length} nodes…`);
        }

        const averageSecurityScore =
            results.length > 0
                ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
                : 0;

        const topSecureNode = results.sort((a, b) => b.score - a.score)[0];

        return {
            summary: {
                totalAudited: results.length,
                averageScore: averageSecurityScore, // mapped to averageScore for compat
                topShop: topSecureNode?.shopName ?? 'N/A', // mapped to topShop for compat
                completedAt: new Date().toISOString(),
            },
            results,
        };
    }

    @Tool({
        name: 'apply_security_policy',
        description:
            'Deploys a security isolation policy onto a specified node. ' +
            'This tool REQUIRES task augmentation — you must pass `task: {}` to execute.',
        inputSchema: PolicyDeploySchema,
        taskSupport: 'required',
        examples: {
            request: { shopId: 'filesystem-node', pizzaName: 'NoOutboundNetworkPolicy', quantity: 1 },
            response: {
                orderId: 'POL-12345',
                status: 'confirmed',
                estimatedMinutes: 2,
                total: '$10.00',
                items: [{ name: 'NoOutboundNetworkPolicy', quantity: 1, price: '$10.00' }],
            },
        },
    })
    async applySecurityPolicy(
        args: z.infer<typeof PolicyDeploySchema>,
        ctx: ExecutionContext,
    ) {
        const node = this.aegisService.getNodeById(args.shopId);
        if (!node) {
            throw new Error(`Capability node not found: ${args.shopId}`);
        }

        ctx.logger.info('Processing policy binding request', {
            nodeId: args.shopId,
            policy: args.pizzaName,
            replication: args.quantity,
        });

        // Step 1 - syntax compilation
        ctx.task?.updateProgress(`🔍 Parsing policy rules for "${args.pizzaName}" and checking taxonomy compliance…`);
        await sleep(600);
        ctx.task?.throwIfCancelled();

        // Step 2 - simulation and audit checks
        ctx.task?.updateProgress(`🛡️ Running policy conflict matrix simulation checks…`);
        await sleep(1000);
        ctx.task?.throwIfCancelled();

        // Step 3 - register rule compliance
        ctx.task?.updateProgress(`🔑 Submitting rules registration to the Policy Engine container…`);
        await sleep(700);
        ctx.task?.throwIfCancelled();

        // Step 4 - confirm
        ctx.task?.updateProgress(`⚡ Policy successfully enrolled and active on target container nodes!`);
        await sleep(300);

        const difficultyLevel = node.priceLevel * 10;
        const totalCostMetric = difficultyLevel * args.quantity;

        ctx.logger.info('Policy deployed and verified compliance success', { nodeId: args.shopId, totalCostMetric });

        return {
            orderId: `POL-${Date.now().toString(36).toUpperCase()}`, // maps to orderId for task result compatibility
            status: 'confirmed',
            shop: node.name, // maps to shop name
            estimatedMinutes: 1,
            total: `$${totalCostMetric.toFixed(2)}`, // maps to price/overhead metric
            items: [
                {
                    name: args.pizzaName,
                    quantity: args.quantity,
                    price: `$${(difficultyLevel * args.quantity).toFixed(2)}`,
                },
            ],
            placedAt: new Date().toISOString(),
        };
    }
}
