"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subDepartmentController = void 0;
const database_1 = require("../lib/database");
exports.subDepartmentController = {
    async create(req, res) {
        const subDepartment = await database_1.prisma.subDepartment.create({
            data: {
                departmentId: req.params.departmentId,
                name: req.body.name,
                description: req.body.description,
            },
        });
        res.status(201).json(subDepartment);
    },
    async list(req, res) {
        const subDepartments = await database_1.prisma.subDepartment.findMany({
            where: { departmentId: req.params.departmentId },
            orderBy: { name: "asc" },
        });
        res.json(subDepartments);
    },
    async update(req, res) {
        const subDepartment = await database_1.prisma.subDepartment.update({
            where: { id: req.params.id },
            data: {
                name: req.body.name,
                description: req.body.description,
            },
        });
        res.json(subDepartment);
    },
    async delete(req, res) {
        await database_1.prisma.subDepartment.delete({ where: { id: req.params.id } });
        res.status(200).json({ message: "sub-department deleted" });
    },
};
//# sourceMappingURL=subDepartment.controller.js.map