import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import { prisma } from "../lib/database";
import { AppError } from "../middleware/errorHandler";
import {
  buildDepartmentTemplateWorkbook,
  parseDepartmentWorkbook,
  DepartmentRowError,
  ParsedDepartmentGroup,
} from "../utils/departmentBulkUpload";

export const departmentController = {
  // POST /departments  { name, description }  (GLOBAL_ADMIN only)
  async create(req: AuthedRequest, res: Response) {
    const department = await prisma.department.create({
      data: {
        name: req.body.name,
        description: req.body.description,
      },
    });
    res.status(201).json(department);
  },

  // GET /departments
  async list(req: AuthedRequest, res: Response) {
    const departments = await prisma.department.findMany({
      select: {
        _count: { select: { agents: true, tickets: true, } },
        id : true,
        name : true,  
        description : true, 
        cxo: {
          select: {
            fullName: true
          },
        },
        manager:{
          select :{ 
            fullName :true
          }
        }
      },
    });
    res.json(departments);
  },

  // GET /departments/:id
  // @ts-ignore
  async getById(req: AuthedRequest, res: Response) {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: { agents: true, categories: true, keywords: true },
    });
    if (!department) return res.status(404).json({ error: "Not found" });
    res.json(department);
  },

  // PATCH /departments/:id  { name?, description? }  (GLOBAL_ADMIN only)
  async update(req: AuthedRequest, res: Response) {
    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: { name: req.body.name, description: req.body.description },
    });
    res.json(department);
  },

  async delete(req:AuthedRequest,res:Response){
    const deleteDepartment = await prisma.department.delete({
      where : {id : req.params.id},
    })
    res.status(200).json({message:"department deleted"})
  },

  // GET /departments/bulk-upload/template  (GLOBAL_ADMIN only)
  // Returns a .xlsx template with the repeat-row columns accepted by
  // bulkUpload below (department, sub-department, category per row).
  async downloadTemplate(req: AuthedRequest, res: Response) {
    const buffer = buildDepartmentTemplateWorkbook();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="department_bulk_upload_template.xlsx"');
    res.send(buffer);
  },

  // POST /departments/bulk-upload  (multipart/form-data, field "file")  (GLOBAL_ADMIN only)
  // Reads the uploaded .xlsx/.xls using the "repeat row" pattern - one row
  // per (department, sub-department, category) combination - and creates,
  // per department block: the Department, its sub-departments (optional),
  // and its categories (each either department-wide or scoped to one of
  // that department's sub-departments). Returns a per-department summary
  // so the admin can see exactly what happened without guessing from a
  // single success/failure flag.
  async bulkUpload(req: AuthedRequest, res: Response) {
    const file = (req as AuthedRequest & { file?: Express.Multer.File }).file;
    if (!file) {
      throw new AppError("No file uploaded. Attach an .xlsx or .xls file under the 'file' field", 400);
    }

    const { departments, errors: parseErrors, totalRows } = parseDepartmentWorkbook(file.buffer);

    const existing = await prisma.department.findMany({ select: { name: true } });
    const existingNames = new Set(existing.map((d) => d.name.trim().toLowerCase()));

    const rowErrors: DepartmentRowError[] = [...parseErrors];
    const skipped: { row: number; name: string; reason: string }[] = [];
    // If a department name already exists, the whole block (its
    // sub-departments and categories in this file included) is skipped -
    // it is not merged into the existing department.
    const toCreate: ParsedDepartmentGroup[] = departments.filter((group) => {
      if (existingNames.has(group.name.toLowerCase())) {
        skipped.push({ row: group.row, name: group.name, reason: "A department with this name already exists" });
        return false;
      }
      return true;
    });

    // Interactive transaction (not the array form) because sub-departments
    // and categories need the just-created department's/sub-department's id
    // before they can be inserted.
    const created = toCreate.length
      ? await prisma.$transaction(async (tx) => {
          const results: {
            id: string;
            name: string;
            description: string | null;
            subDepartmentCount: number;
            categoryCount: number;
          }[] = [];

          for (const group of toCreate) {
            const department = await tx.department.create({
              data: { name: group.name, description: group.description },
            });

            const subDepartmentIdByName = new Map<string, string>();
            for (const sub of group.subDepartments) {
              const createdSub = await tx.subDepartment.create({
                data: {
                  departmentId: department.id,
                  name: sub.name,
                  description: sub.description,
                },
              });
              subDepartmentIdByName.set(sub.name.toLowerCase(), createdSub.id);
            }

            for (const category of group.categories) {
              await tx.ticketCategory.create({
                data: {
                  departmentId: department.id,
                  subDepartmentId: category.subDepartmentName
                    ? subDepartmentIdByName.get(category.subDepartmentName.toLowerCase()) ?? null
                    : null,
                  name: category.name,
                  defaultSlaMinutes: category.slaMinutes,
                  isWorkStopping: category.isWorkStopping,
                  isSafetyViolation: category.isSafetyViolation,
                  // defaultPriority intentionally omitted - schema default (P3) applies.
                },
              });
            }

            results.push({
              id: department.id,
              name: department.name,
              description: department.description,
              subDepartmentCount: group.subDepartments.length,
              categoryCount: group.categories.length,
            });
          }

          return results;
        })
      : [];

    res.status(201).json({
      totalRows,
      createdCount: created.length,
      skippedCount: skipped.length,
      errorCount: rowErrors.length,
      departments: created,
      skipped,
      errors: rowErrors.sort((a, b) => a.row - b.row),
    });
  },
};


