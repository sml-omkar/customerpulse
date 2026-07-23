"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keywordController = void 0;
const keyword_service_1 = require("../services/keyword.service");
const database_1 = require("../lib/database");
exports.keywordController = {
    async create(req, res) {
        const keyword = await database_1.prisma.keyword.create({
            data: {
                departmentId: req.body.departmentId,
                name: req.body.name,
                description: req.body.description,
                synonyms: req.body.synonyms ?? [],
            },
        });
        res.status(201).json(keyword);
    },
    async list(req, res) {
        const keywords = await database_1.prisma.keyword.findMany({
            where: { departmentId: req.query.departmentId },
            include: { agents: { include: { user: true } } },
        });
        res.json(keywords);
    },
    async delete(req, res) {
        const deleteKeyword = await database_1.prisma.keyword.delete({
            where: { id: req.params.id }
        });
        res.status(200).json({ message: "keyword deleted" });
    },
    async assignSkills(req, res) {
        const result = await keyword_service_1.keywordService.assignSkillsToAgent(req.params.userId, req.body.keywordIds);
        res.json(result);
    },
    async removeSkill(req, res) {
        await database_1.prisma.userKeyword.delete({
            where: { userId_keywordId: { userId: req.params.userId, keywordId: req.params.keywordId } },
        });
        res.status(204).send();
    },
    async listSuggestions(req, res) {
        const suggestions = await keyword_service_1.keywordService.listSuggestions(req.params.departmentId, req.query.status);
        res.json(suggestions);
    },
    async promoteSuggestion(req, res) {
        const keyword = await keyword_service_1.keywordService.promoteSuggestion({
            suggestionId: req.params.id,
            reviewedById: req.user.id,
            name: req.body.name,
            synonyms: req.body.synonyms,
            grantToUserIds: req.body.grantToUserIds,
        });
        res.status(201).json(keyword);
    },
    async rejectSuggestion(req, res) {
        const suggestion = await keyword_service_1.keywordService.rejectSuggestion(req.params.id, req.user.id);
        res.json(suggestion);
    },
};
//# sourceMappingURL=keyword.controller.js.map