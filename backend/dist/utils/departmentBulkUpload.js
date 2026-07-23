"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEPARTMENT_TEMPLATE_HEADERS = void 0;
exports.buildDepartmentTemplateWorkbook = buildDepartmentTemplateWorkbook;
exports.parseDepartmentWorkbook = parseDepartmentWorkbook;
const XLSX = __importStar(require("xlsx"));
const errorHandler_1 = require("../middleware/errorHandler");
exports.DEPARTMENT_TEMPLATE_HEADERS = [
    "department_name",
    "department_description",
    "sub_department_name",
    "sub_department_description",
    "category_name",
    "category_sla_minutes",
    "category_is_work_stopping",
    "category_is_safety_violation",
];
const TRUE_VALUES = new Set(["true", "yes", "y", "1", "x"]);
const FALSE_VALUES = new Set(["false", "no", "n", "0", ""]);
function buildDepartmentTemplateWorkbook() {
    const workbook = XLSX.utils.book_new();
    const dataSheet = XLSX.utils.aoa_to_sheet([
        [...exports.DEPARTMENT_TEMPLATE_HEADERS],
        [
            "Fleet Operations",
            "Handles vehicle and equipment tickets",
            "Heavy Equipment",
            "Off-road and heavy machinery",
            "Breakdown",
            120,
            "TRUE",
            "TRUE",
        ],
        ["Fleet Operations", "", "Light Vehicles", "On-road vehicles", "Parts Request", 5, "FALSE", "FALSE"],
        ["Fleet Operations", "", "", "", "Scheduled Service", 10, "FALSE", "FALSE"],
        ["IT Support", "Handles internal IT tickets and hardware requests", "", "", "", "", "", ""],
    ]);
    dataSheet["!cols"] = [
        { wch: 22 }, { wch: 34 }, { wch: 20 }, { wch: 26 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(workbook, dataSheet, "Departments");
    const instructionsSheet = XLSX.utils.aoa_to_sheet([
        ["Instructions"],
        ["1. One row per (department, sub-department, category) combination - this is the 'repeat row' pattern."],
        ["   Repeat department_name on every row that belongs to it. See the 'Fleet Operations' example rows."],
        ["2. department_name is required on every row and must be unique. department_description is optional -"],
        ["   only needs to be filled in once per department; blank on repeat rows is fine."],
        ["3. sub_department_name is OPTIONAL. Leave both sub_department_name and sub_department_description"],
        ["   blank for a department that has no sub-departments, or for a row that only adds a"],
        ["   department-wide category (see the 'Scheduled Service' row above)."],
        ["4. category_name is OPTIONAL per row - a row can define just a department, just a sub-department,"],
        ["   or a category, or any combination. If sub_department_name is filled in on the same row as"],
        ["   category_name, the category is scoped to that sub-department. If sub_department_name is blank,"],
        ["   the category is department-wide."],
        ["5. category_sla_minutes is the SLA deadline in MINUTES (e.g. 120 = 2 hours). Leave blank for no SLA."],
        ["6. category_is_work_stopping and category_is_safety_violation accept TRUE/FALSE (also YES/NO, 1/0)."],
        ["   Leave blank for FALSE. These are admin-only flags."],
        ["7. Priority is not set here - every bulk-uploaded category defaults to P3 and can be changed later."],
        ["8. If a department name already exists, the ENTIRE department block (including its sub-departments"],
        ["   and categories in this file) is skipped - it will not be merged into the existing department."],
        ["9. Save the file as .xlsx or .xls and upload it from the Departments page."],
        [""],
        ["Tip: to avoid spelling mistakes, apply Excel Data Validation (List) on department_name,"],
        ["sub_department_name and category_name so users pick from a dropdown instead of typing free text."],
    ]);
    instructionsSheet["!cols"] = [{ wch: 100 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
function parseBoolean(raw, row, columnLabel, errors) {
    const value = String(raw ?? "").trim().toLowerCase();
    if (TRUE_VALUES.has(value))
        return true;
    if (FALSE_VALUES.has(value))
        return false;
    errors.push({ row, reason: `Invalid value "${String(raw)}" for ${columnLabel} - expected TRUE/FALSE` });
    return false;
}
function parseSlaMinutes(raw, row, errors) {
    const value = String(raw ?? "").trim();
    if (!value)
        return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
        errors.push({ row, reason: `Invalid category_sla_minutes "${value}" - must be a positive whole number` });
        return undefined;
    }
    return parsed;
}
function parseDepartmentWorkbook(buffer) {
    let workbook;
    try {
        workbook = XLSX.read(buffer, { type: "buffer" });
    }
    catch {
        throw new errorHandler_1.AppError("Could not read the uploaded file. Please upload a valid .xlsx or .xls file", 400);
    }
    const sheetName = workbook.SheetNames[0];
    const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
    if (!sheet) {
        throw new errorHandler_1.AppError("The uploaded file has no sheets", 400);
    }
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });
    if (raw.length === 0) {
        throw new errorHandler_1.AppError("The uploaded file is empty", 400);
    }
    const headerRow = raw[0].map((h) => String(h ?? "").trim().toLowerCase());
    const col = (name) => headerRow.indexOf(name);
    const departmentNameCol = col("department_name");
    const departmentDescCol = col("department_description");
    const subDeptNameCol = col("sub_department_name");
    const subDeptDescCol = col("sub_department_description");
    const categoryNameCol = col("category_name");
    const categorySlaCol = col("category_sla_minutes");
    const categoryWorkStoppingCol = col("category_is_work_stopping");
    const categorySafetyCol = col("category_is_safety_violation");
    if (departmentNameCol === -1) {
        throw new errorHandler_1.AppError(`Missing required "department_name" column. Expected headers: ${exports.DEPARTMENT_TEMPLATE_HEADERS.join(", ")}`, 400);
    }
    const dataRows = raw.slice(1);
    if (dataRows.length === 0) {
        throw new errorHandler_1.AppError("The uploaded file has no data rows", 400);
    }
    const errors = [];
    const groupsByKey = new Map();
    const groups = [];
    dataRows.forEach((cells, idx) => {
        const spreadsheetRow = idx + 2;
        const cell = (c) => (c === -1 ? "" : String(cells[c] ?? "").trim());
        const departmentName = cell(departmentNameCol);
        if (!departmentName) {
            errors.push({ row: spreadsheetRow, reason: "Missing department_name" });
            return;
        }
        if (departmentName.length > 200) {
            errors.push({ row: spreadsheetRow, reason: "department_name exceeds 200 characters" });
            return;
        }
        const deptKey = departmentName.toLowerCase();
        let group = groupsByKey.get(deptKey);
        if (!group) {
            group = { row: spreadsheetRow, name: departmentName, subDepartments: [], categories: [] };
            groupsByKey.set(deptKey, group);
            groups.push(group);
        }
        const departmentDescription = cell(departmentDescCol);
        if (departmentDescription && !group.description) {
            group.description = departmentDescription;
        }
        const subDepartmentName = cell(subDeptNameCol);
        if (subDepartmentName) {
            if (subDepartmentName.length > 200) {
                errors.push({ row: spreadsheetRow, reason: "sub_department_name exceeds 200 characters" });
                return;
            }
            const existingSub = group.subDepartments.find((s) => s.name.toLowerCase() === subDepartmentName.toLowerCase());
            if (!existingSub) {
                const subDepartmentDescription = cell(subDeptDescCol);
                group.subDepartments.push({
                    row: spreadsheetRow,
                    name: subDepartmentName,
                    description: subDepartmentDescription || undefined,
                });
            }
        }
        const categoryName = cell(categoryNameCol);
        if (categoryName) {
            if (categoryName.length > 200) {
                errors.push({ row: spreadsheetRow, reason: "category_name exceeds 200 characters" });
                return;
            }
            if (subDepartmentName &&
                !group.subDepartments.some((s) => s.name.toLowerCase() === subDepartmentName.toLowerCase())) {
                errors.push({
                    row: spreadsheetRow,
                    reason: `sub_department_name "${subDepartmentName}" could not be added, so category "${categoryName}" was skipped`,
                });
                return;
            }
            const dedupeKey = `${(subDepartmentName || "").toLowerCase()}|${categoryName.toLowerCase()}`;
            const alreadySeen = group.categories.some((c) => `${(c.subDepartmentName || "").toLowerCase()}|${c.name.toLowerCase()}` === dedupeKey);
            if (alreadySeen) {
                const scope = subDepartmentName ? `sub-department "${subDepartmentName}"` : "department-wide";
                errors.push({
                    row: spreadsheetRow,
                    reason: `Duplicate category "${categoryName}" (${scope}) within the file`,
                });
                return;
            }
            const slaMinutes = parseSlaMinutes(cells[categorySlaCol], spreadsheetRow, errors);
            const isWorkStopping = parseBoolean(cells[categoryWorkStoppingCol], spreadsheetRow, "category_is_work_stopping", errors);
            const isSafetyViolation = parseBoolean(cells[categorySafetyCol], spreadsheetRow, "category_is_safety_violation", errors);
            group.categories.push({
                row: spreadsheetRow,
                name: categoryName,
                subDepartmentName: subDepartmentName || undefined,
                slaMinutes,
                isWorkStopping,
                isSafetyViolation,
            });
        }
    });
    return { departments: groups, errors, totalRows: dataRows.length };
}
//# sourceMappingURL=departmentBulkUpload.js.map