"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keywordService = void 0;
const database_1 = require("../lib/database");
const client_1 = require("../generated/prisma/client");
const STOPWORDS = new Set([
    "the", "a", "an", "is", "are", "was", "were", "to", "of", "in", "on", "for", "and", "or",
    "my", "i", "it", "this", "that", "with", "please", "can", "you", "not", "have", "has",
    "be", "at", "from", "as", "when", "after", "before", "need", "help", "issue", "issues",
    "problem", "problems", "not", "working", "cant", "can't", "unable", "getting",
]);
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}
exports.keywordService = {
    async extractAndLinkKeywords(params) {
        const { ticketId, departmentId, text } = params;
        const tokens = tokenize(text);
        if (tokens.length === 0)
            return { matched: [], suggested: [] };
        const deptKeywords = await database_1.prisma.keyword.findMany({ where: { departmentId } });
        const matched = deptKeywords.filter((kw) => {
            const haystack = [kw.name.toLowerCase(), ...kw.synonyms.map((s) => s.toLowerCase())];
            return tokens.some((t) => haystack.includes(t)) || haystack.some((h) => text.toLowerCase().includes(h));
        });
        if (matched.length > 0) {
            await database_1.prisma.ticketKeyword.createMany({
                data: matched.map((kw) => ({ ticketId, keywordId: kw.id })),
                skipDuplicates: true,
            });
        }
        const knownTerms = new Set(deptKeywords.flatMap((k) => [k.name.toLowerCase(), ...k.synonyms.map((s) => s.toLowerCase())]));
        const unmatchedTokens = [...new Set(tokens.filter((t) => !knownTerms.has(t)))];
        const suggested = [];
        for (const term of unmatchedTokens) {
            const suggestion = await database_1.prisma.keywordSuggestion.upsert({
                where: { departmentId_term: { departmentId, term } },
                update: { occurrenceCount: { increment: 1 } },
                create: { departmentId, term },
            });
            suggested.push(suggestion);
        }
        return { matched, suggested };
    },
    async listSuggestions(departmentId, status = client_1.SuggestionStatus.PENDING) {
        return database_1.prisma.keywordSuggestion.findMany({
            where: { departmentId, status },
            orderBy: { occurrenceCount: "desc" },
        });
    },
    async promoteSuggestion(params) {
        const { suggestionId, reviewedById, name, synonyms = [], grantToUserIds = [] } = params;
        const suggestion = await database_1.prisma.keywordSuggestion.findUniqueOrThrow({ where: { id: suggestionId } });
        return database_1.prisma.$transaction(async (tx) => {
            const keyword = await tx.keyword.create({
                data: {
                    departmentId: suggestion.departmentId,
                    name: name ?? suggestion.term,
                    synonyms,
                },
            });
            if (grantToUserIds.length > 0) {
                await tx.userKeyword.createMany({
                    data: grantToUserIds.map((userId) => ({ userId, keywordId: keyword.id })),
                    skipDuplicates: true,
                });
            }
            await tx.keywordSuggestion.update({
                where: { id: suggestionId },
                data: { status: client_1.SuggestionStatus.APPROVED, promotedKeywordId: keyword.id, reviewedById },
            });
            return keyword;
        });
    },
    async rejectSuggestion(suggestionId, reviewedById) {
        return database_1.prisma.keywordSuggestion.update({
            where: { id: suggestionId },
            data: { status: client_1.SuggestionStatus.REJECTED, reviewedById },
        });
    },
    async assignSkillsToAgent(userId, keywordIds) {
        return database_1.prisma.userKeyword.createMany({
            data: keywordIds.map((keywordId) => ({ userId, keywordId })),
            skipDuplicates: true,
        });
    },
};
//# sourceMappingURL=keyword.service.js.map