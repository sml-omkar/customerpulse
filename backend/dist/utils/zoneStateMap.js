"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZONES = exports.ZONE_STATE_MAP = void 0;
exports.resolveZone = resolveZone;
exports.statesForZone = statesForZone;
exports.ZONE_STATE_MAP = {
    "North": ["Delhi", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Ladakh", "Madhya Pradesh", "Punjab", "Uttar Pradesh", "Uttarakhand"],
    "West 1": ["Goa", "Maharashtra"],
    "West 2": ["Dadra & Nagar Haveli", "Daman & Diu", "Gujarat", "Rajasthan"],
    "South 1": ["Karnataka", "Kerala"],
    "South 2": ["Andaman & Nicobar Islands", "Andhra Pradesh", "Lakshadweep", "Puducherry", "Tamil Nadu", "Telangana"],
    "East": ["Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Jharkhand", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Sikkim", "Tripura", "West Bengal"],
};
exports.ZONES = Object.keys(exports.ZONE_STATE_MAP);
const ZONE_LOOKUP = new Map(exports.ZONES.map((z) => [z.toLowerCase(), z]));
function resolveZone(rawZone) {
    if (!rawZone)
        return null;
    return ZONE_LOOKUP.get(rawZone.trim().toLowerCase()) ?? null;
}
function statesForZone(rawZone) {
    const zone = resolveZone(rawZone);
    if (!zone)
        return "";
    return (exports.ZONE_STATE_MAP[zone] || []).join(", ");
}
//# sourceMappingURL=zoneStateMap.js.map