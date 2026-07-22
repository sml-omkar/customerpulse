// Zone -> State/UT mapping (per the company's Region List).
//
// The admin-facing onboarding form only lets the person filling it in pick
// a Zone (never raw states). Previously the frontend resolved that Zone to
// its underlying state(s) and sent the resolved comma-separated state list
// to the API. That meant the mapping logic (and the source of truth for
// which states a zone covers) lived on the client.
//
// Now the frontend sends the selected Zone as-is, and this module is the
// single place responsible for resolving a Zone to the state(s) it covers.
// Keep this in sync with the frontend's ZONES list if the frontend also
// needs to render the zone picker/reference sheet.
export const ZONE_STATE_MAP: Record<string, string[]> = {
  "North": ["Delhi", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Ladakh", "Madhya Pradesh", "Punjab", "Uttar Pradesh", "Uttarakhand"],
  "West 1": ["Goa", "Maharashtra"],
  "West 2": ["Dadra & Nagar Haveli", "Daman & Diu", "Gujarat", "Rajasthan"],
  "South 1": ["Karnataka", "Kerala"],
  "South 2": ["Andaman & Nicobar Islands", "Andhra Pradesh", "Lakshadweep", "Puducherry", "Tamil Nadu", "Telangana"],
  "East": ["Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Jharkhand", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Sikkim", "Tripura", "West Bengal"],
};

export const ZONES = Object.keys(ZONE_STATE_MAP);

const ZONE_LOOKUP = new Map(ZONES.map((z) => [z.toLowerCase(), z]));

/**
 * Case-insensitively resolve a raw zone name to the canonical Zone key,
 * or null if it doesn't match any known zone.
 */
export function resolveZone(rawZone: string | null | undefined): string | null {
  if (!rawZone) return null;
  return ZONE_LOOKUP.get(rawZone.trim().toLowerCase()) ?? null;
}

/**
 * Given a Zone name, resolve it to the comma-separated list of states it
 * covers - this is what actually gets stored against the invitation/user.
 * Returns "" if the zone is empty/unrecognized.
 */
export function statesForZone(rawZone: string | null | undefined): string {
  const zone = resolveZone(rawZone);
  if (!zone) return "";
  return (ZONE_STATE_MAP[zone] || []).join(", ");
}
