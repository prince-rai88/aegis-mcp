import { ToolDecorator as Tool, Widget, ExecutionContext, Injectable, z } from '@nitrostack/core';
import { AegisService } from './aegis.service.js';

/**
 * Aegis widget metadata for ChatGPT / MCP Apps (CSP for Unsplash images, optional border).
 */
function aegisWidget(route: string) {
    return {
        route,
        prefersBorder: true,
        csp: {
            resourceDomains: ['https://images.unsplash.com'],
        },
    };
}

const ShowGraphSchema = z.object({
    filter: z.enum(['open_now', 'top_rated', 'all']).optional().describe('Filter to apply to security nodes'),
});

const ShowInventorySchema = z.object({
    openNow: z.boolean().optional().describe('Show only active/connected nodes'),
    minRating: z.number().min(1).max(5).optional().describe('Minimum safety level rating (1-5)'),
    maxPrice: z.number().min(1).max(3).optional().describe('Maximum threat risk level (1-3)'),
});

const ShowNodeSchema = z.object({
    shopId: z.string().describe('ID of the security node to display (maps to shopId for widget flow compatibility)'),
});

@Injectable({ deps: [AegisService] })
export class AegisTools {
    constructor(private readonly aegisService: AegisService) { }

    @Tool({
        name: 'show_security_graph',
        description: 'Display an interactive map graph of capabilities and MCP nodes',
        inputSchema: ShowGraphSchema,
        examples: {
            request: { filter: 'all' },
            response: {
                shops: [
                    {
                        id: 'filesystem-node',
                        name: 'Local Filesystem Access',
                        description: 'Read and write capabilities on host workspace',
                        address: 'workspace://sandbox/local-disk',
                        coords: [-122.4194, 37.7749],
                        rating: 4.8,
                        reviews: 2471,
                        priceLevel: 2,
                        cuisine: ['Filesystem', 'Read', 'Write'],
                        hours: { open: '00:00 UTC', close: '23:59 UTC' },
                        phone: 'alert-webhook-fs-sev2',
                        website: 'https://aegis.security/docs/filesystem',
                        image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d',
                        specialties: ['Directory Traversal Check'],
                        openNow: true
                    }
                ],
                filter: 'all',
                totalShops: 1
            }
        }
    })
    @Widget(aegisWidget('aegis-map'))
    async showSecurityGraph(args: z.infer<typeof ShowGraphSchema>, ctx: ExecutionContext) {
        let nodes;

        switch (args.filter) {
            case 'open_now':
                nodes = this.aegisService.getNodesFiltered({ openNow: true });
                break;
            case 'top_rated':
                nodes = this.aegisService.getTopRatedNodes();
                break;
            default:
                nodes = this.aegisService.getAllNodes();
        }

        ctx.logger.info('Showing security graph', { filter: args.filter, totalNodes: nodes.length });

        return {
            shops: nodes, // Map to 'shops' to preserve widget payload expectations
            filter: args.filter || 'all',
            totalShops: nodes.length,
        };
    }

    @Tool({
        name: 'show_capability_inventory',
        description: 'Display a list of registered capability nodes with security filtering options',
        inputSchema: ShowInventorySchema,
        examples: {
            request: { openNow: true },
            response: {
                shops: [
                    {
                        id: 'filesystem-node',
                        name: 'Local Filesystem Access',
                        description: 'Read and write capabilities on host workspace',
                        address: 'workspace://sandbox/local-disk',
                        coords: [-122.4194, 37.7749],
                        rating: 4.8,
                        reviews: 2471,
                        priceLevel: 2,
                        cuisine: ['Filesystem', 'Read', 'Write'],
                        hours: { open: '00:00 UTC', close: '23:59 UTC' },
                        phone: 'alert-webhook-fs-sev2',
                        image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d',
                        specialties: ['Directory Traversal Check'],
                        openNow: true
                    }
                ],
                filters: { openNow: true },
                totalShops: 1
            }
        }
    })
    @Widget(aegisWidget('aegis-list'))
    async showCapabilityInventory(args: z.infer<typeof ShowInventorySchema>, ctx: ExecutionContext) {
        const nodes = this.aegisService.getNodesFiltered(args);

        ctx.logger.info('Showing capability inventory list', { filters: args, totalNodes: nodes.length });

        return {
            shops: nodes, // Map to 'shops' to preserve widget payload expectations
            filters: args,
            totalShops: nodes.length,
        };
    }

    @Tool({
        name: 'show_capability_details',
        description: 'Display detailed safety, risk information and reviews for a specific capability node',
        inputSchema: ShowNodeSchema,
        examples: {
            request: { shopId: 'filesystem-node' },
            response: {
                shop: {
                    id: 'filesystem-node',
                    name: 'Local Filesystem Access',
                    description: 'Read and write capabilities on host workspace',
                    address: 'workspace://sandbox/local-disk',
                    coords: [-122.4194, 37.7749],
                    rating: 4.8,
                    reviews: 2471,
                    priceLevel: 2,
                    cuisine: ['Filesystem', 'Read', 'Write'],
                    hours: { open: '00:00 UTC', close: '23:59 UTC' },
                    phone: 'alert-webhook-fs-sev2',
                    website: 'https://aegis.security/docs/filesystem',
                    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d',
                    specialties: ['Directory Traversal Check'],
                    openNow: true
                },
                relatedShops: []
            }
        }
    })
    @Widget(aegisWidget('aegis-detail'))
    async showCapabilityDetails(args: z.infer<typeof ShowNodeSchema>, ctx: ExecutionContext) {
        const node = this.aegisService.getNodeById(args.shopId);

        if (!node) {
            throw new Error(`Capability node not found: ${args.shopId}`);
        }

        ctx.logger.info('Showing capability node details', { id: args.shopId, name: node.name });

        // Map to expected widget schema keys
        const relatedNodes = this.aegisService.getTopRatedNodes(3).filter(n => n.id !== node.id);

        return {
            shop: node,
            relatedShops: relatedNodes,
        };
    }
}
