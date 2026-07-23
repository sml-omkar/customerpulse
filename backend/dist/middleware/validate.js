"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
function validateBody(schema) {
    return (req, res, next) => {
        req.body = schema.parse(req.body);
        next();
    };
}
function validateQuery(schema) {
    return (req, res, next) => {
        req.query = schema.parse(req.query);
        next();
    };
}
//# sourceMappingURL=validate.js.map