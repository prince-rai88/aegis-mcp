export interface AegisNode {
    id: string;
    name: string;
    description: string;
    address: string;
    coords: [number, number]; // [lng, lat] for Mapbox
    rating: number; // Safety/Reliability rating (1.0 to 5.0)
    reviews: number; // Audited tool invocations count
    priceLevel: 1 | 2 | 3; // Threat Level: 1 = Low Risk, 2 = Med Risk, 3 = High Risk
    cuisine: string[]; // Capability categories
    hours: {
        open: string;
        close: string;
    }; // Inspection active window
    phone: string; // Alert notification endpoint/webhook/contact
    website?: string; // Documentation address
    image: string; // Visual representation
    specialties: string[]; // Key APIs / Critical Hazards
    openNow: boolean; // Active connection status
}

export const AEGIS_NODES: AegisNode[] = [
    {
        id: 'filesystem-node',
        name: 'Local Filesystem Access',
        description: 'Read and write capabilities on the host workspace directory with directory traversal isolation safeguards.',
        address: 'workspace://sandbox/local-disk',
        coords: [-122.4194, 37.7749],
        rating: 4.8,
        reviews: 2471,
        priceLevel: 2, // Medium Threat
        cuisine: ['Filesystem', 'Read', 'Write', 'Local Disk'],
        hours: { open: '00:00 UTC', close: '23:59 UTC' },
        phone: 'alert-webhook-fs-sev2',
        website: 'https://aegis.security/docs/filesystem',
        image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d',
        specialties: ['Directory Traversal Check', 'Read Workspace', 'Write Workspace'],
        openNow: true,
    },
    {
        id: 'external-http-gate',
        name: 'Outbound HTTP Gateway',
        description: 'Outbound HTTP request execution. Evaluates request domains against strict DNS blocklists before dispatching payloads.',
        address: 'gateway://networks/dns-filtered',
        coords: [-122.4089, 37.7858],
        rating: 4.9,
        reviews: 1542,
        priceLevel: 3, // High Threat (Outbound exfiltration potential)
        cuisine: ['Network', 'HTTP', 'Outbound', 'DNS Filter'],
        hours: { open: '00:00 UTC', close: '23:59 UTC' },
        phone: 'alert-webhook-network-sev1',
        website: 'https://aegis.security/docs/network',
        image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5',
        specialties: ['Domain Blocklist Check', 'Payload Exfiltration Scan', 'OAuth Consent Sync'],
        openNow: true,
    },
    {
        id: 'secure-execution-bash',
        name: 'Isolated Bash Sandbox',
        description: 'Executes scripts in a highly restricted container without root privileges or host environment bleed.',
        address: 'sandbox://isolation/container-bash',
        coords: [-122.4216, 37.7599],
        rating: 4.2,
        reviews: 984,
        priceLevel: 3, // High Threat (Arbitrary code execution)
        cuisine: ['Execution', 'Shell', 'Sandbox', 'Isolated'],
        hours: { open: '08:00 UTC', close: '20:00 UTC' }, // Restricted window
        phone: 'alert-webhook-bash-sev1',
        image: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97',
        specialties: ['System Call Interception', 'Non-privileged Boundary', 'Shell Injection Shield'],
        openNow: true,
    },
    {
        id: 'database-credentials-vault',
        name: 'Customer DB Credentials Vault',
        description: 'Read/write storage parameters for database credentials. Relies on KMS envelope encryption for keys.',
        address: 'vault://kms/postgres-creds',
        coords: [-122.4252, 37.7615],
        rating: 5.0,
        reviews: 8012,
        priceLevel: 1, // Low Threat due to KMS isolation
        cuisine: ['Database', 'Secrets', 'KMS Encryption', 'Audit Logged'],
        hours: { open: '00:00 UTC', close: '23:59 UTC' },
        phone: 'alert-webhook-vault-sev3',
        website: 'https://aegis.security/docs/vault',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3',
        specialties: ['KMS Envelope Encrypt', 'Strict RBAC Bindings', 'Instant Token Revocation'],
        openNow: false, // Locked state
    },
    {
        id: 'dev-config-environment',
        name: 'Dev Environment Reader',
        description: 'Exposes local development environment variables to agent context for config discovery.',
        address: 'environment://local/process-env',
        coords: [-122.4102, 37.7999],
        rating: 4.4,
        reviews: 320,
        priceLevel: 2, // Medium Threat (Cred leak potential)
        cuisine: ['Environment', 'Configuration', 'Variables', 'Read Only'],
        hours: { open: '00:00 UTC', close: '23:59 UTC' },
        phone: 'alert-webhook-env-sev2',
        image: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871',
        specialties: ['Secret Key Redaction', 'Local Config Extraction', 'Access Event Logging'],
        openNow: true,
    },
];
