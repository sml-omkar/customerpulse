"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadsRouter = void 0;
const express_1 = require("express");
const express_2 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const s3_1 = require("../lib/s3");
exports.uploadsRouter = (0, express_1.Router)();
exports.uploadsRouter.put("/*", express_2.default.raw({ type: "*/*", limit: s3_1.MAX_ATTACHMENT_SIZE_BYTES }), (req, res) => {
    const key = req.params[0];
    if (!key) {
        res.status(400).json({ error: "Missing attachment key" });
        return;
    }
    const body = req.body;
    if (!Buffer.isBuffer(body) || body.length === 0) {
        res.status(400).json({ error: "No file data received" });
        return;
    }
    if (body.length > s3_1.MAX_ATTACHMENT_SIZE_BYTES) {
        res.status(400).json({ error: "File exceeds the 20MB limit" });
        return;
    }
    const filePath = (0, s3_1.resolveLocalAttachmentPath)(key);
    fs_1.default.writeFile(filePath, body, (err) => {
        if (err) {
            res.status(500).json({ error: "Failed to save file to local storage" });
            return;
        }
        res.status(200).json({ ok: true });
    });
});
exports.uploadsRouter.get("/*", (req, res) => {
    const key = req.params[0];
    if (!key) {
        res.status(400).json({ error: "Missing attachment key" });
        return;
    }
    const filePath = (0, s3_1.resolveLocalAttachmentPath)(key);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: "File not found" });
        }
    });
});
//# sourceMappingURL=uploads.js.map