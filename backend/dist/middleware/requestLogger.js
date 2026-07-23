"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on("finish", () => {
        const ms = Date.now() - start;
        const who = req.user?.id ?? "anon";
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms user=${who}`);
    });
    next();
}
//# sourceMappingURL=requestLogger.js.map