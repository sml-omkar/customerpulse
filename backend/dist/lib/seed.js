"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIENT_OPTIONS = void 0;
const client_1 = require("../generated/prisma/client");
const database_1 = require("./database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const TEST_PASSWORD = "12345";
exports.CLIENT_OPTIONS = [
    {
        name: "Aditya",
        isKeyClient: true,
        projects: [
            { name: "finance", isShutdownJob: false },
        ],
    }, {
        name: "Asian",
        isKeyClient: false,
        projects: [
            { name: "shipping", isShutdownJob: false },
        ],
    }
];
const DEPARTMENTS = {
    Logistic: {
        description: "Transport, movement, and on-road issues for crane/trailer dispatch",
        categories: [
            { name: "Driver absconded", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Vehicle breakdown", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Railway gate removal", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Accident", defaultSlaMinutes: 2880, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
            { name: "Trailer placement delay", defaultSlaMinutes: 720, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Vehicle caught by RTO/check-post authority", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Road blocked due to traffic", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Road permission pending", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "State highway permission delay", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Diesel availability/payment issue", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Toll plaza delay and congestion", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Soft soil and hard ground issue", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Insufficient space trailers movement", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Delay in escort vehicle arrangement", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Village/local public movement restrictions", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Night movement restriction by local authority", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Overhead electric line obstruction", defaultSlaMinutes: 720, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
            { name: "Bridge load capacity restriction", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
            { name: "Wrong route", defaultSlaMinutes: 720, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
        ],
        keywords: [],
    },
    Safety: {
        description: "Health, safety, and on-site compliance incidents",
        categories: [
            { name: "Safety officer was not available at the site", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
            { name: "Workers were not wearing safety harnesses while working at height", defaultSlaMinutes: 60, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
            { name: "Safety documents (JSA, HIRA) were not available or provided", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: false, isSafetyViolation: true },
            { name: "Crane activities were carried out without a work permit", defaultSlaMinutes: 60, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
            { name: "Employees were deployed without induction training", defaultSlaMinutes: 60, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
            { name: "Tools and tackles were found in damaged condition", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
            { name: "Master tools and tackles list is not available", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: false, isSafetyViolation: true },
        ],
        keywords: [],
    },
    Operation: {
        description: "Day-to-day crew, equipment, and crane deployment operations",
        categories: [
            { name: "HSD shortage", defaultSlaMinutes: 720, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Rigger Shortage", defaultSlaMinutes: 2880, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Operator shortage", defaultSlaMinutes: 2880, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Equipment shortage", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Delay in deployment", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Supervisor shortage", defaultSlaMinutes: 2880, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Clear communication", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "Crane breakdown", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true },
            { name: "Crane swapping", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Crane withdrawal without intimation", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Documentation", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
        ],
        keywords: [],
    },
    Maintenance: {
        description: "Crane and equipment technical faults and repair requests",
        categories: [
            { name: "SLI(safe load indicator) not working properly", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
            { name: "Limit switch cut off system not working properly", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
            { name: "Safety parameters like swing horn/reverse horn and lights not working properly", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
            { name: "Load Variation issue", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
            { name: "Winch(Hoist)/Swing/Telescopic/Marching operations slow", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true },
            { name: "Hook synchronization issues", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
            { name: "Wire rope condition not good/strands in damaged condition", defaultSlaMinutes: 2880, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
            { name: "Starting issues due to starter/alternator/harness/ECU", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true },
            { name: "Wiring short circuit", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
            { name: "Engine/Gear box/Clutch failure", defaultSlaMinutes: 4320, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true },
            { name: "Lifting belts/D shackles/Hook block latches/Jack plates locking system not in good condition", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
        ],
        keywords: [],
    },
    "Supply Chain Management": {
        description: "Market-hired vehicles, operators, and third-party asset coordination",
        categories: [
            { name: "Market asset / vehicle not available", defaultSlaMinutes: 5760, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Operator not available", defaultSlaMinutes: 5760, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Market vehicle B/D", defaultSlaMinutes: 5760, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Operator Behaviour Issues", defaultSlaMinutes: 5760, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "Operator competency issues", defaultSlaMinutes: 5760, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "LS Mismatch Issues", defaultSlaMinutes: 4320, minSupportLevel: client_1.SupportLevel.L1 },
        ],
        keywords: [],
    },
    "HR / Plant HR": {
        description: "Site and plant-level HR, crew, and workforce administration issues",
        categories: [
            { name: "Operator Documentation Issues", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "Crew attendance issues", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Operator shortage", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Operator Behaviour Issues", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "Operator competency issues", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "Rigger Shortage", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Crew Salary issues", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "HR Compliance Issue", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
        ],
        keywords: [],
    },
    "Billing Issues": {
        description: "Invoicing, billing certification, and payment reconciliation issues",
        categories: [
            { name: "LS Certification Issues", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "Billing amount mis-match", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "Billing Period Mis-match", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "Summary sheet pending from client", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
        ],
        keywords: [],
    },
    "Cross Rental Cranes": {
        description: "Cross-hired crane deployment, availability, and documentation issues",
        categories: [
            { name: "LS Certification Issues", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "Delay in deployment", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Operator not available", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1, isWorkStopping: true },
            { name: "Operator Behaviour Issues", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "Operator competency issues", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "Crane is under B/D", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L2, isWorkStopping: true },
            { name: "Crane Document not available", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
        ],
        keywords: [],
    },
    Sales: {
        description: "Sales inquiries, quotations, and customer/contract-related requests",
        categories: [
            { name: "No response / acknowledgement on RFQ", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "Sales contract documentation issues", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "Lack of transparancy", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "Frequent Crane substitution", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "Contract Disagreements", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
            { name: "Consistently proposing older cranes", defaultSlaMinutes: 1440, minSupportLevel: client_1.SupportLevel.L1 },
        ],
        keywords: [],
    },
};
async function main() {
    const passwordHash = await bcryptjs_1.default.hash(TEST_PASSWORD, 10);
    const globalAdmin = await database_1.prisma.user.create({
        data: {
            email: "admin@sanghvi.com",
            fullName: "Sanghvi Movers Admin",
            passwordHash,
            role: client_1.UserRole.GLOBAL_ADMIN,
        },
    });
    for (const [deptName, deptData] of Object.entries(DEPARTMENTS)) {
        const department = await database_1.prisma.department.create({
            data: { name: deptName, description: deptData.description },
        });
        const subDepartmentIdByName = {};
        if (deptData.subDepartments?.length) {
            for (const subDeptName of deptData.subDepartments) {
                const subDepartment = await database_1.prisma.subDepartment.create({
                    data: { departmentId: department.id, name: subDeptName },
                });
                subDepartmentIdByName[subDeptName] = subDepartment.id;
            }
        }
        await database_1.prisma.ticketCategory.createMany({
            data: deptData.categories.map((c) => ({
                departmentId: department.id,
                subDepartmentId: c.subDepartmentName ? subDepartmentIdByName[c.subDepartmentName] : null,
                name: c.name,
                defaultSlaMinutes: c.defaultSlaMinutes,
                isWorkStopping: c.isWorkStopping ?? false,
                isSafetyViolation: c.isSafetyViolation ?? false,
            })),
        });
        await database_1.prisma.keyword.createMany({
            data: deptData.keywords.map((k) => ({
                departmentId: department.id,
                name: k.name,
                synonyms: k.synonyms,
            })),
        });
    }
    for (const client of exports.CLIENT_OPTIONS) {
        const existing = await database_1.prisma.client.findFirst({ where: { name: client.name } });
        if (existing)
            continue;
        await database_1.prisma.client.create({
            data: {
                name: client.name,
                isKeyClient: client.isKeyClient,
                projects: {
                    create: client.projects.map((p) => ({
                        name: p.name,
                        isShutdownJob: p.isShutdownJob,
                    })),
                },
            },
        });
    }
    console.log("client seeded successfully!");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => database_1.prisma.$disconnect());
//# sourceMappingURL=seed.js.map