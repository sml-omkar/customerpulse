"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../generated/prisma/client");
const database_1 = require("./database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const node_crypto_1 = require("node:crypto");
const DEMO_PASSWORD = "Demo@12345";
function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const rng = mulberry32(20260719);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const randInt = (min, max) => Math.floor(min + rng() * (max - min + 1));
const DEMO_DEPARTMENTS = {
    "IT Support": {
        description: "Network, hardware, and software support",
        categories: [
            { name: "Network & VPN", defaultSlaMinutes: 240, defaultPriority: client_1.TicketPriority.P1 },
            { name: "Hardware", defaultSlaMinutes: 1440, defaultPriority: client_1.TicketPriority.P3 },
            { name: "Software Install", defaultSlaMinutes: 1440, defaultPriority: client_1.TicketPriority.P3 },
            { name: "Access & Permissions", defaultSlaMinutes: 720, defaultPriority: client_1.TicketPriority.P2 },
        ],
    },
    "Facilities & Admin": {
        description: "Site maintenance, housekeeping, and asset requests",
        categories: [
            { name: "Maintenance Request", defaultSlaMinutes: 1440, defaultPriority: client_1.TicketPriority.P2 },
            { name: "Housekeeping", defaultSlaMinutes: 2880, defaultPriority: client_1.TicketPriority.P4 },
            { name: "Security & Access", defaultSlaMinutes: 480, defaultPriority: client_1.TicketPriority.P2 },
            { name: "Asset Request", defaultSlaMinutes: 2880, defaultPriority: client_1.TicketPriority.P3 },
        ],
    },
    "HR Operations": {
        description: "Payroll, leave, onboarding, and policy queries",
        categories: [
            { name: "Payroll Query", defaultSlaMinutes: 1440, defaultPriority: client_1.TicketPriority.P2 },
            { name: "Leave & Attendance", defaultSlaMinutes: 720, defaultPriority: client_1.TicketPriority.P3 },
            { name: "Onboarding", defaultSlaMinutes: 2880, defaultPriority: client_1.TicketPriority.P3 },
            { name: "Policy Clarification", defaultSlaMinutes: 4320, defaultPriority: client_1.TicketPriority.P4 },
        ],
    },
    "Finance & Accounts": {
        description: "Reimbursements, vendor payments, and budget approvals",
        categories: [
            { name: "Reimbursement", defaultSlaMinutes: 2880, defaultPriority: client_1.TicketPriority.P3 },
            { name: "Vendor Payment", defaultSlaMinutes: 1440, defaultPriority: client_1.TicketPriority.P2 },
            { name: "Invoice Query", defaultSlaMinutes: 1440, defaultPriority: client_1.TicketPriority.P3 },
            { name: "Budget Approval", defaultSlaMinutes: 4320, defaultPriority: client_1.TicketPriority.P4 },
        ],
    },
};
const SITE_POOL = [
    "Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Telangana",
    "Gujarat", "West Bengal", "Uttar Pradesh", "Haryana", "Rajasthan",
];
const CLIENT_POOL = [
    "Nimbus Logistics", "Everest Foods Ltd", "Solstice Retail", "Vantage Manufacturing",
    "BluePeak Textiles", "Coral Bay Hospitality", "Meridian Pharma", "Zenith Motors",
    "Harbor Freight Co", "Crestline Realty", "Oakwood Analytics", "Silverline Insurance",
];
const TITLE_TEMPLATES = [
    "Issue with {cat} at {site} site",
    "Request: {cat} for {client}",
    "{cat} not resolved since last week",
    "Follow-up on {cat}",
    "Urgent — {cat} blocking work at {site}",
    "{client} raised a concern about {cat}",
];
const STATUS_WEIGHTS = [
    [client_1.TicketStatus.OPEN, 0.24],
    [client_1.TicketStatus.IN_PROGRESS, 0.22],
    [client_1.TicketStatus.ON_HOLD, 0.10],
    [client_1.TicketStatus.REOPENED, 0.05],
    [client_1.TicketStatus.RESOLVED, 0.39],
];
function weightedStatus() {
    const r = rng();
    let acc = 0;
    for (const [s, w] of STATUS_WEIGHTS) {
        acc += w;
        if (r <= acc)
            return s;
    }
    return client_1.TicketStatus.RESOLVED;
}
const slaHoursForPriority = (p) => p === client_1.TicketPriority.P1 ? 4 : p === client_1.TicketPriority.P2 ? 24 : p === client_1.TicketPriority.P3 ? 72 : 120;
function buildStatusTimeline(status, createdAt, elapsedHours) {
    const at = (hoursFromCreated) => new Date(createdAt.getTime() + hoursFromCreated * 3600000);
    if (status === client_1.TicketStatus.OPEN) {
        return [{ status: client_1.TicketStatus.OPEN, changedAt: createdAt }];
    }
    if (status === client_1.TicketStatus.ON_HOLD) {
        return [
            { status: client_1.TicketStatus.OPEN, changedAt: at(0) },
            { status: client_1.TicketStatus.IN_PROGRESS, changedAt: at(elapsedHours * 0.15) },
            { status: client_1.TicketStatus.ON_HOLD, changedAt: at(elapsedHours * 0.5) },
        ];
    }
    if (status === client_1.TicketStatus.REOPENED) {
        return [
            { status: client_1.TicketStatus.OPEN, changedAt: at(0) },
            { status: client_1.TicketStatus.IN_PROGRESS, changedAt: at(elapsedHours * 0.1) },
            { status: client_1.TicketStatus.RESOLVED, changedAt: at(elapsedHours * 0.6) },
            { status: client_1.TicketStatus.REOPENED, changedAt: at(elapsedHours * 0.8) },
        ];
    }
    return [
        { status: client_1.TicketStatus.OPEN, changedAt: at(0) },
        { status: client_1.TicketStatus.IN_PROGRESS, changedAt: at(elapsedHours * 0.2) },
    ];
}
async function main() {
    const REQUESTER_NAMES = [
        "Aarav Sharma", "Priya Nair", "Rohan Mehta", "Ishita Kapoor", "Kabir Singh",
        "Ananya Iyer", "Vivaan Joshi", "Diya Reddy", "Aditya Rao", "Meera Pillai",
    ];
    const requesterPasswordHash = await bcryptjs_1.default.hash(DEMO_PASSWORD, 10);
    const requesters = [];
    for (const [i, name] of REQUESTER_NAMES.entries()) {
        const email = `requester.demo${i + 1}@sanghvi.com`;
        let user = await database_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await database_1.prisma.user.create({
                data: {
                    email,
                    fullName: name,
                    passwordHash: requesterPasswordHash,
                    role: client_1.UserRole.REQUESTER,
                    approvalStatus: client_1.ApprovalStatus.APPROVED,
                },
            });
        }
        requesters.push(user);
    }
    const cxoEmail = "cxo.demo@sanghvi.com";
    const cxoPasswordHash = await bcryptjs_1.default.hash(DEMO_PASSWORD, 10);
    let cxo = await database_1.prisma.user.findUnique({ where: { email: cxoEmail } });
    if (!cxo) {
        cxo = await database_1.prisma.user.create({
            data: {
                email: cxoEmail,
                fullName: "Demo CXO",
                passwordHash: cxoPasswordHash,
                role: client_1.UserRole.CXO,
            },
        });
    }
    const deptCtxByName = {};
    for (const [deptName, deptData] of Object.entries(DEMO_DEPARTMENTS)) {
        let department = await database_1.prisma.department.findFirst({ where: { name: deptName, cxoId: cxo.id } });
        if (!department) {
            const hodEmail = `hod.${deptName.toLowerCase().replace(/[^a-z]+/g, ".")}@sanghvi.com`;
            let hod = await database_1.prisma.user.findUnique({ where: { email: hodEmail } });
            if (!hod) {
                hod = await database_1.prisma.user.create({
                    data: {
                        email: hodEmail,
                        fullName: `${deptName} HOD`,
                        passwordHash: await bcryptjs_1.default.hash(DEMO_PASSWORD, 10),
                        role: client_1.UserRole.HOD,
                    },
                });
            }
            department = await database_1.prisma.department.create({
                data: {
                    name: deptName,
                    description: deptData.description,
                    managerId: hod.id,
                    cxoId: cxo.id,
                },
            });
            await database_1.prisma.ticketCategory.createMany({
                data: deptData.categories.map((c) => ({
                    departmentId: department.id,
                    name: c.name,
                    defaultSlaMinutes: c.defaultSlaMinutes,
                    defaultPriority: c.defaultPriority,
                })),
            });
        }
        const categories = await database_1.prisma.ticketCategory.findMany({
            where: { departmentId: department.id },
            select: { id: true, name: true, defaultSlaMinutes: true },
        });
        const agentIds = [];
        for (let i = 1; i <= 2; i++) {
            const agentEmail = `agent.${deptName.toLowerCase().replace(/[^a-z]+/g, ".")}${i}@sanghvi.com`;
            let agent = await database_1.prisma.user.findUnique({ where: { email: agentEmail } });
            if (!agent) {
                agent = await database_1.prisma.user.create({
                    data: {
                        email: agentEmail,
                        fullName: `${deptName} Agent ${i}`,
                        passwordHash: await bcryptjs_1.default.hash(DEMO_PASSWORD, 10),
                        role: client_1.UserRole.AGENT,
                        agentsdepartmentId: department.id,
                        supportLevel: i === 1 ? client_1.SupportLevel.L2 : client_1.SupportLevel.L1,
                    },
                });
            }
            agentIds.push(agent.id);
        }
        deptCtxByName[deptName] = { id: department.id, categories, agentIds };
    }
    const existingDemoTickets = await database_1.prisma.ticket.count({ where: { ticketNumber: { startsWith: "DEMO-" } } });
    if (existingDemoTickets > 0) {
        const firstDeptName = Object.keys(deptCtxByName)[0];
        const firstAgentEmail = `agent.${firstDeptName.toLowerCase().replace(/[^a-z]+/g, ".")}1@sanghvi.com`;
        console.log(`Demo tickets already exist (${existingDemoTickets}), skipping ticket generation.`);
        console.log(`CXO login   -> email: ${cxoEmail}  password: ${DEMO_PASSWORD}`);
        console.log(`Agent login -> email: ${firstAgentEmail}  password: ${DEMO_PASSWORD}`);
        return;
    }
    const deptNames = Object.keys(deptCtxByName);
    const now = new Date();
    const TICKET_COUNT = 640;
    const ticketsData = [];
    const statusHistoryData = [];
    for (let i = 0; i < TICKET_COUNT; i++) {
        const deptName = pick(deptNames);
        const dept = deptCtxByName[deptName];
        const category = dept.categories.length ? pick(dept.categories) : undefined;
        const categoryId = category?.id ?? null;
        const daysAgo = randInt(0, 89);
        const createdAt = new Date(now.getTime() - daysAgo * 86400000 - randInt(0, 86399) * 1000);
        const status = weightedStatus();
        const priority = pick([
            client_1.TicketPriority.P1, client_1.TicketPriority.P2, client_1.TicketPriority.P2,
            client_1.TicketPriority.P3, client_1.TicketPriority.P3, client_1.TicketPriority.P4,
        ]);
        const slaHours = category?.defaultSlaMinutes ? category.defaultSlaMinutes / 60 : slaHoursForPriority(priority);
        const slaDeadline = new Date(createdAt.getTime() + slaHours * 3600000);
        const isResolved = status === client_1.TicketStatus.RESOLVED;
        const resolutionHours = Math.max(0.5, rng() * slaHours * 1.6);
        const resolvedAt = isResolved ? new Date(createdAt.getTime() + resolutionHours * 3600000) : null;
        const referenceNow = isResolved ? resolvedAt : now;
        const slaBreached = referenceNow.getTime() > slaDeadline.getTime();
        const site = pick(SITE_POOL);
        const client = pick(CLIENT_POOL);
        const catName = category?.name ?? "General Request";
        const title = pick(TITLE_TEMPLATES)
            .replace("{cat}", catName)
            .replace("{site}", site)
            .replace("{client}", client);
        const assigneeId = status === client_1.TicketStatus.OPEN && rng() < 0.2 ? null : pick(dept.agentIds);
        const ticketId = (0, node_crypto_1.randomUUID)();
        const elapsedHours = isResolved ? resolutionHours : (now.getTime() - createdAt.getTime()) / 3600000;
        if (assigneeId) {
            for (const row of buildStatusTimeline(status, createdAt, elapsedHours)) {
                statusHistoryData.push({ id: (0, node_crypto_1.randomUUID)(), ticketId, ...row });
            }
        }
        ticketsData.push({
            id: ticketId,
            ticketNumber: `DEMO-${3000 + i}`,
            title,
            requesterId: pick(requesters).id,
            departmentId: dept.id,
            categoryId,
            clientName: client,
            clientEmail: `contact@${client.toLowerCase().replace(/[^a-z]+/g, "")}.com`,
            dateOfOccurance: createdAt,
            site,
            status,
            priority,
            assigneeId,
            slaDeadline: isResolved ? null : slaDeadline,
            slaBreached,
            resolvedAt,
            turnOverTime: isResolved ? resolutionHours * 3600 : null,
            createdAt,
        });
    }
    await database_1.prisma.ticket.createMany({ data: ticketsData });
    if (statusHistoryData.length) {
        await database_1.prisma.ticketStatusHistory.createMany({ data: statusHistoryData });
    }
    const firstDept = deptNames[0];
    const firstAgentEmail = `agent.${firstDept.toLowerCase().replace(/[^a-z]+/g, ".")}1@sanghvi.com`;
    console.log(`Seeded ${ticketsData.length} demo tickets across ${deptNames.length} departments.`);
    console.log(`Seeded ${statusHistoryData.length} status-history rows for the agent time-in-status view.`);
    console.log(`CXO login   -> email: ${cxoEmail}  password: ${DEMO_PASSWORD}`);
    console.log(`Agent login -> email: ${firstAgentEmail}  password: ${DEMO_PASSWORD}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => database_1.prisma.$disconnect());
//# sourceMappingURL=cxodashboardseed.js.map