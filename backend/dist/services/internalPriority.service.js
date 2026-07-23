"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalPriorityService = void 0;
const client_1 = require("../generated/prisma/client");
const FACTORS = [
    { key: "isWorkStopping", weight: 30, impactMultiplier: 2 },
    { key: "isSafetyViolation", weight: 25, impactMultiplier: 1.8 },
    { key: "isShutdownJob", weight: 20, impactMultiplier: 1.5 },
    { key: "isReportedByTopManagement", weight: 15, impactMultiplier: 1.3 },
    { key: "isKeyClient", weight: 10, impactMultiplier: 1.2 },
];
exports.internalPriorityService = {
    computeScore(inputs) {
        const selected = FACTORS.filter((f) => inputs[f.key]);
        const selectedSumWeights = selected.reduce((sum, f) => sum + f.weight, 0);
        if (selectedSumWeights === 0) {
            return { level: client_1.InternalPriorityLevel.LOW, finalScore: 0, selectedSumWeights: 0, severityScore: 0 };
        }
        const severityScore = selectedSumWeights / 10;
        const impactResultSum = selected.reduce((sum, f) => {
            const activePriorityMix = f.weight / selectedSumWeights;
            const impactResult = activePriorityMix * f.impactMultiplier;
            console.log("activePriorityMix : ", f.weight, "=", activePriorityMix);
            console.log("impactResult : ", activePriorityMix, " = ", impactResult);
            return sum + impactResult;
        }, 0);
        const finalScore = impactResultSum * severityScore;
        console.log("severityScore = ", severityScore);
        console.log("finalScore = ", finalScore);
        return {
            level: this.scoreToLevel(finalScore),
            finalScore,
            selectedSumWeights,
            severityScore,
        };
    },
    scoreToLevel(finalScore) {
        if (finalScore >= 8)
            return client_1.InternalPriorityLevel.CRITICAL;
        if (finalScore >= 6)
            return client_1.InternalPriorityLevel.HIGH;
        if (finalScore >= 3)
            return client_1.InternalPriorityLevel.MEDIUM;
        return client_1.InternalPriorityLevel.LOW;
    },
};
//# sourceMappingURL=internalPriority.service.js.map