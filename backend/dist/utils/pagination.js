"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.paginatedResponse = paginatedResponse;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 500;
function parsePagination(req) {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit) || DEFAULT_LIMIT));
    return { page, limit, skip: (page - 1) * limit, take: limit };
}
function paginatedResponse(items, total, { page, limit }) {
    return {
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
}
//# sourceMappingURL=pagination.js.map