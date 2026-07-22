import { UserRole, SupportLevel } from "../generated/prisma/client";
import {prisma} from "./database"
import bcrypt from "bcryptjs";


// Fixed test password for the seeded admin account.
const TEST_PASSWORD = "12345";


// client list 

export const CLIENT_OPTIONS: {
    name : string,
    isKeyClient : boolean,
    projects : { name: string, isShutdownJob: boolean }[],
  }[] = [
  {
    name : "Aditya",
    isKeyClient : true,
    projects : [
      { name : "finance", isShutdownJob : false },
    ],
  },{
    name : "Asian" ,
    isKeyClient : false,
    projects : [
      { name : "shipping", isShutdownJob : false },
    ],
  }
];



// ---- department -> categories -> keywords, all in one place ----
// Keywords are seeded upfront so ticket auto-assignment has something to
// match against as soon as the admin invites and skills-up real agents -
// no pre-created users here, that's intentionally left to the invite flow.


const DEPARTMENTS: Record<string,
  {
    description: string;
    // NOTE(added): optional grouping within the department. Categories
    // below can reference one of these by name via subDepartmentName -
    // departments that don't need the extra grouping just omit this.
    subDepartments?: string[];
    categories: {
      name: string;
      defaultSlaMinutes: number;
      minSupportLevel: SupportLevel;
      // NOTE(added): optional - must match an entry in subDepartments above.
      subDepartmentName?: string;
      // NOTE(added): admin-only classification flags, default false.
      isWorkStopping?: boolean;
      isSafetyViolation?: boolean;
    }[];
    keywords: { name: string; synonyms: string[] }[];
  }
> = {
  // ---- Sourced from the Issue Master List (TAT column converted from
  // days to minutes: 1 day = 1440 minutes; "Immediate" TAT = 60 minutes).
  // isWorkStopping / isSafetyViolation are judgment calls based on what
  // each issue type actually blocks or endangers on site.
  Logistic: {
    description: "Transport, movement, and on-road issues for crane/trailer dispatch",
    categories: [
      { name: "Driver absconded", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Vehicle breakdown", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Railway gate removal", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Accident", defaultSlaMinutes: 2880, minSupportLevel: SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
      { name: "Trailer placement delay", defaultSlaMinutes: 720, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Vehicle caught by RTO/check-post authority", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Road blocked due to traffic", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Road permission pending", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "State highway permission delay", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Diesel availability/payment issue", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Toll plaza delay and congestion", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Soft soil and hard ground issue", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Insufficient space trailers movement", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Delay in escort vehicle arrangement", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Village/local public movement restrictions", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Night movement restriction by local authority", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Overhead electric line obstruction", defaultSlaMinutes: 720, minSupportLevel: SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
      { name: "Bridge load capacity restriction", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
      { name: "Wrong route", defaultSlaMinutes: 720, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
    ],
    keywords: [],
  },
  Safety: {
    description: "Health, safety, and on-site compliance incidents",
    categories: [
      { name: "Safety officer was not available at the site", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
      { name: "Workers were not wearing safety harnesses while working at height", defaultSlaMinutes: 60, minSupportLevel: SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
      { name: "Safety documents (JSA, HIRA) were not available or provided", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L2, isWorkStopping: false, isSafetyViolation: true },
      { name: "Crane activities were carried out without a work permit", defaultSlaMinutes: 60, minSupportLevel: SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
      { name: "Employees were deployed without induction training", defaultSlaMinutes: 60, minSupportLevel: SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
      { name: "Tools and tackles were found in damaged condition", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
      { name: "Master tools and tackles list is not available", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L2, isWorkStopping: false, isSafetyViolation: true },
    ],
    keywords: [],
  },
  Operation: {
    description: "Day-to-day crew, equipment, and crane deployment operations",
    categories: [
      { name: "HSD shortage", defaultSlaMinutes: 720, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Rigger Shortage", defaultSlaMinutes: 2880, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Operator shortage", defaultSlaMinutes: 2880, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Equipment shortage", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Delay in deployment", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Supervisor shortage", defaultSlaMinutes: 2880, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Clear communication", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
      { name: "Crane breakdown", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L2, isWorkStopping: true },
      { name: "Crane swapping", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Crane withdrawal without intimation", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Documentation", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
    ],
    keywords: [],
  },
  Maintenance: {
    description: "Crane and equipment technical faults and repair requests",
    categories: [
      { name: "SLI(safe load indicator) not working properly", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
      { name: "Limit switch cut off system not working properly", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
      { name: "Safety parameters like swing horn/reverse horn and lights not working properly", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
      { name: "Load Variation issue", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
      { name: "Winch(Hoist)/Swing/Telescopic/Marching operations slow", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L2, isWorkStopping: true },
      { name: "Hook synchronization issues", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
      { name: "Wire rope condition not good/strands in damaged condition", defaultSlaMinutes: 2880, minSupportLevel: SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
      { name: "Starting issues due to starter/alternator/harness/ECU", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L2, isWorkStopping: true },
      { name: "Wiring short circuit", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
      { name: "Engine/Gear box/Clutch failure", defaultSlaMinutes: 4320, minSupportLevel: SupportLevel.L2, isWorkStopping: true },
      { name: "Lifting belts/D shackles/Hook block latches/Jack plates locking system not in good condition", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L2, isWorkStopping: true, isSafetyViolation: true },
    ],
    keywords: [],
  },
  "Supply Chain Management": {
    description: "Market-hired vehicles, operators, and third-party asset coordination",
    categories: [
      { name: "Market asset / vehicle not available", defaultSlaMinutes: 5760, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Operator not available", defaultSlaMinutes: 5760, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Market vehicle B/D", defaultSlaMinutes: 5760, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Operator Behaviour Issues", defaultSlaMinutes: 5760, minSupportLevel: SupportLevel.L1 },
      { name: "Operator competency issues", defaultSlaMinutes: 5760, minSupportLevel: SupportLevel.L1 },
      { name: "LS Mismatch Issues", defaultSlaMinutes: 4320, minSupportLevel: SupportLevel.L1 },
    ],
    keywords: [],
  },
  "HR / Plant HR": {
    description: "Site and plant-level HR, crew, and workforce administration issues",
    categories: [
      { name: "Operator Documentation Issues", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
      { name: "Crew attendance issues", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Operator shortage", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Operator Behaviour Issues", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
      { name: "Operator competency issues", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
      { name: "Rigger Shortage", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Crew Salary issues", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
      { name: "HR Compliance Issue", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
    ],
    keywords: [],
  },
  "Billing Issues": {
    description: "Invoicing, billing certification, and payment reconciliation issues",
    categories: [
      { name: "LS Certification Issues", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
      { name: "Billing amount mis-match", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
      { name: "Billing Period Mis-match", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
      { name: "Summary sheet pending from client", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
    ],
    keywords: [],
  },
  "Cross Rental Cranes": {
    description: "Cross-hired crane deployment, availability, and documentation issues",
    categories: [
      { name: "LS Certification Issues", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
      { name: "Delay in deployment", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Operator not available", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1, isWorkStopping: true },
      { name: "Operator Behaviour Issues", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
      { name: "Operator competency issues", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
      { name: "Crane is under B/D", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L2, isWorkStopping: true },
      { name: "Crane Document not available", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
    ],
    keywords: [],
  },
  Sales: {
    description: "Sales inquiries, quotations, and customer/contract-related requests",
    categories: [
      { name: "No response / acknowledgement on RFQ", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
      { name: "Sales contract documentation issues", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
      { name: "Lack of transparancy", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
      { name: "Frequent Crane substitution", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
      { name: "Contract Disagreements", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
      { name: "Consistently proposing older cranes", defaultSlaMinutes: 1440, minSupportLevel: SupportLevel.L1 },
    ],
    keywords: [],
  },
};

async function main() {

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const globalAdmin = await prisma.user.create({
    data: {
      email: "admin@sanghvi.com",
      fullName: "Sanghvi Movers Admin",
      passwordHash,
      role: UserRole.GLOBAL_ADMIN,
    },
  });

  for (const [deptName, deptData] of Object.entries(DEPARTMENTS)) {
    const department = await prisma.department.create({
      data: { name: deptName, description: deptData.description },
    });

    // Sub-departments are optional - only a handful of departments define
    // them. Create them first so categories below can be mapped to one.
    const subDepartmentIdByName: Record<string, string> = {};
    if (deptData.subDepartments?.length) {
      for (const subDeptName of deptData.subDepartments) {
        const subDepartment = await prisma.subDepartment.create({
          data: { departmentId: department.id, name: subDeptName },
        });
        subDepartmentIdByName[subDeptName] = subDepartment.id;
      }
    }

    await prisma.ticketCategory.createMany({
      data: deptData.categories.map((c) => ({
        departmentId: department.id,
        subDepartmentId: c.subDepartmentName ? subDepartmentIdByName[c.subDepartmentName] : null,
        name: c.name,
        defaultSlaMinutes: c.defaultSlaMinutes,
        isWorkStopping: c.isWorkStopping ?? false,
        isSafetyViolation: c.isSafetyViolation ?? false,
      })),
    });

    await prisma.keyword.createMany({
      data: deptData.keywords.map((k) => ({
        departmentId: department.id,
        name: k.name,
        synonyms: k.synonyms,
      })),
    });


  }
  

    // NOTE(updated): createMany can't do nested writes, and each client can
    // now have multiple projects, so we create clients one at a time
    // (skipping ones that already exist) and nested-create their projects.
    for (const client of CLIENT_OPTIONS) {
      const existing = await prisma.client.findFirst({ where: { name: client.name } });
      if (existing) continue;

      await prisma.client.create({
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
  .finally(() => prisma.$disconnect());
