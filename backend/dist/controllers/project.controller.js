"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectController = void 0;
const database_1 = require("../lib/database");
const errorHandler_1 = require("../middleware/errorHandler");
exports.projectController = {
    async getProjectsForClient(req, res) {
        try {
            const { clientId } = req.params;
            const client = await database_1.prisma.client.findUnique({ where: { id: clientId } });
            if (!client) {
                throw new errorHandler_1.AppError("The client doesnt exist", 404);
            }
            const projects = await database_1.prisma.project.findMany({
                where: { clientId },
                orderBy: { createdAt: "desc" },
            });
            return res.status(200).json({
                success: true,
                count: projects.length,
                data: projects,
            });
        }
        catch (error) {
            console.error("Get Projects Error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }
    },
    async createProject(req, res) {
        try {
            const { clientId } = req.params;
            const { name, isShutdownJob } = req.body;
            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Project name is required",
                });
            }
            const client = await database_1.prisma.client.findUnique({ where: { id: clientId } });
            if (!client) {
                return res.json("The client doesnt exist").status(404);
            }
            const existCheck = await database_1.prisma.project.findFirst({
                where: {
                    clientId,
                    name: name.trim().toUpperCase(),
                },
            });
            if (existCheck) {
                return res.json("This project already exists for the client").status(401);
            }
            const project = await database_1.prisma.project.create({
                data: {
                    name: name.trim().toUpperCase(),
                    isShutdownJob: Boolean(isShutdownJob),
                    clientId,
                },
            });
            return res.status(201).json({
                success: true,
                message: "Project created successfully",
                data: project,
            });
        }
        catch (error) {
            console.error("Create Project Error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }
    },
    async updateProject(req, res) {
        try {
            const { id } = req.params;
            const { name, isShutdownJob } = req.body;
            const existingProject = await database_1.prisma.project.findUnique({ where: { id } });
            if (!existingProject) {
                throw new errorHandler_1.AppError("The project doesnt exist", 404);
            }
            const updatedProject = await database_1.prisma.project.update({
                where: { id },
                data: {
                    ...(name !== undefined && name.trim() ? { name: name.trim().toUpperCase() } : {}),
                    ...(isShutdownJob !== undefined ? { isShutdownJob: Boolean(isShutdownJob) } : {}),
                },
            });
            return res.status(200).json({
                success: true,
                message: "Project updated successfully",
                data: updatedProject,
            });
        }
        catch (error) {
            console.error("Update Project Error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }
    },
    async deleteProject(req, res) {
        try {
            const { id } = req.params;
            const existingProject = await database_1.prisma.project.findUnique({ where: { id } });
            if (!existingProject) {
                throw new errorHandler_1.AppError("The project doesnt exist", 404);
            }
            await database_1.prisma.project.delete({ where: { id } });
            return res.status(200).json({
                success: true,
                message: "Project deleted successfully",
            });
        }
        catch (error) {
            console.error("Delete Project Error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }
    },
};
//# sourceMappingURL=project.controller.js.map