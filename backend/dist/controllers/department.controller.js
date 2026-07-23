"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentController = void 0;
const database_1 = require("../lib/database");
const errorHandler_1 = require("../middleware/errorHandler");
const departmentBulkUpload_1 = require("../utils/departmentBulkUpload");
exports.departmentController = {
    async create(req, res) {
        const department = await database_1.prisma.department.create({
            data: {
                name: req.body.name,
                description: req.body.description,
            },
        });
        res.status(201).json(department);
    },
    async list(req, res) {
        const departments = await database_1.prisma.department.findMany({
            select: {
                _count: { select: { agents: true, tickets: true, } },
                id: true,
                name: true,
                description: true,
                cxo: {
                    select: {
                        fullName: true
                    },
                },
                manager: {
                    select: {
                        fullName: true
                    }
                }
            },
        });
        res.json(departments);
    },
    async getById(req, res) {
        const department = await database_1.prisma.department.findUnique({
            where: { id: req.params.id },
            include: { agents: true, categories: true, keywords: true },
        });
        if (!department)
            return res.status(404).json({ error: "Not found" });
        res.json(department);
    },
    async update(req, res) {
        const department = await database_1.prisma.department.update({
            where: { id: req.params.id },
            data: { name: req.body.name, description: req.body.description },
        });
        res.json(department);
    },
    async delete(req, res) {
        const deleteDepartment = await database_1.prisma.department.delete({
            where: { id: req.params.id },
        });
        res.status(200).json({ message: "department deleted" });
    },
    async downloadTemplate(req, res) {
        const buffer = (0, departmentBulkUpload_1.buildDepartmentTemplateWorkbook)();
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", 'attachment; filename="department_bulk_upload_template.xlsx"');
        res.send(buffer);
    },
    async bulkUpload(req, res) {
        const file = req.file;
        if (!file) {
            throw new errorHandler_1.AppError("No file uploaded. Attach an .xlsx or .xls file under the 'file' field", 400);
        }
        const { departments, errors: parseErrors, totalRows } = (0, departmentBulkUpload_1.parseDepartmentWorkbook)(file.buffer);
        const existing = await database_1.prisma.department.findMany({ select: { name: true } });
        const existingNames = new Set(existing.map((d) => d.name.trim().toLowerCase()));
        const rowErrors = [...parseErrors];
        const skipped = [];
        const toCreate = departments.filter((group) => {
            if (existingNames.has(group.name.toLowerCase())) {
                skipped.push({ row: group.row, name: group.name, reason: "A department with this name already exists" });
                return false;
            }
            return true;
        });
        const created = toCreate.length
            ? await database_1.prisma.$transaction(async (tx) => {
                const results = [];
                for (const group of toCreate) {
                    const department = await tx.department.create({
                        data: { name: group.name, description: group.description },
                    });
                    const subDepartmentIdByName = new Map();
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
//# sourceMappingURL=department.controller.js.map