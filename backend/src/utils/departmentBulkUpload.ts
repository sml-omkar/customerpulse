import * as XLSX from "xlsx";
import { AppError } from "../middleware/errorHandler";

// Bulk-upload / template support for departments, sub-departments (optional)
// and categories, all in one file using the "repeat row" pattern: one row
// per (department, sub-department, category) combination, with
// department_name / department_description repeated on every row that
// belongs to that department. This mirrors how the ServiceNow-style import
// discussed above resolves the one-to-many department -> categories shape
// without needing multi-value cells.
//
// A category is optionally scoped to a sub-department (sub_department_name
// filled in) or left department-wide (sub_department_name blank).
// Priority is intentionally NOT a column here - every bulk-uploaded
// category gets the schema default (P3); admins can change it afterwards
// from the category edit screen.

export const DEPARTMENT_TEMPLATE_HEADERS = [
  "department_name",
  "department_description",
  "sub_department_name",
  "sub_department_description",
  "category_name",
  "category_sla_minutes",
  "category_is_work_stopping",
  "category_is_safety_violation",
] as const;

const TRUE_VALUES = new Set(["true", "yes", "y", "1", "x"]);
const FALSE_VALUES = new Set(["false", "no", "n", "0", ""]);

export interface ParsedSubDepartmentRow {
  row: number; // spreadsheet row it was first defined on
  name: string;
  description?: string;
}

export interface ParsedCategoryRow {
  row: number;
  name: string;
  subDepartmentName?: string; // undefined => department-wide category
  slaMinutes?: number;
  isWorkStopping: boolean;
  isSafetyViolation: boolean;
}

export interface ParsedDepartmentGroup {
  row: number; // spreadsheet row the department was first seen on
  name: string;
  description?: string;
  subDepartments: ParsedSubDepartmentRow[];
  categories: ParsedCategoryRow[];
}

export interface DepartmentRowError {
  row: number;
  reason: string;
}

/**
 * Builds the .xlsx template workbook admins download and fill in. Shows the
 * repeat-row pattern with a worked example that mirrors a real department
 * with sub-departments and a mix of department-wide / sub-department-scoped
 * categories.
 */
export function buildDepartmentTemplateWorkbook(): Buffer {
  const workbook = XLSX.utils.book_new();

  const dataSheet = XLSX.utils.aoa_to_sheet([
    [...DEPARTMENT_TEMPLATE_HEADERS],
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

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function parseBoolean(raw: unknown, row: number, columnLabel: string, errors: DepartmentRowError[]): boolean {
  const value = String(raw ?? "").trim().toLowerCase();
  if (TRUE_VALUES.has(value)) return true;
  if (FALSE_VALUES.has(value)) return false;
  errors.push({ row, reason: `Invalid value "${String(raw)}" for ${columnLabel} - expected TRUE/FALSE` });
  return false;
}

function parseSlaMinutes(raw: unknown, row: number, errors: DepartmentRowError[]): number | undefined {
  const value = String(raw ?? "").trim();
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    errors.push({ row, reason: `Invalid category_sla_minutes "${value}" - must be a positive whole number` });
    return undefined;
  }
  return parsed;
}

/**
 * Parses an uploaded workbook's first sheet into department groups (each
 * carrying its own sub-departments and categories, deduped and validated).
 * Throws an AppError for structural problems (unreadable file, missing
 * headers, no data rows) - per-row problems are returned as `errors` so the
 * caller can report them back to the admin instead of failing the whole
 * upload.
 */
export function parseDepartmentWorkbook(buffer: Buffer): {
  departments: ParsedDepartmentGroup[];
  errors: DepartmentRowError[];
  totalRows: number;
} {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    throw new AppError("Could not read the uploaded file. Please upload a valid .xlsx or .xls file", 400);
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet) {
    throw new AppError("The uploaded file has no sheets", 400);
  }

  // header: 1 => array-of-arrays, so we control our own header matching
  // instead of relying on the sheet's exact casing/whitespace.
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: "" });
  if (raw.length === 0) {
    throw new AppError("The uploaded file is empty", 400);
  }

  const headerRow = raw[0].map((h) => String(h ?? "").trim().toLowerCase());
  const col = (name: string) => headerRow.indexOf(name);

  const departmentNameCol = col("department_name");
  const departmentDescCol = col("department_description");
  const subDeptNameCol = col("sub_department_name");
  const subDeptDescCol = col("sub_department_description");
  const categoryNameCol = col("category_name");
  const categorySlaCol = col("category_sla_minutes");
  const categoryWorkStoppingCol = col("category_is_work_stopping");
  const categorySafetyCol = col("category_is_safety_violation");

  if (departmentNameCol === -1) {
    throw new AppError(
      `Missing required "department_name" column. Expected headers: ${DEPARTMENT_TEMPLATE_HEADERS.join(", ")}`,
      400
    );
  }

  const dataRows = raw.slice(1);
  if (dataRows.length === 0) {
    throw new AppError("The uploaded file has no data rows", 400);
  }

  const errors: DepartmentRowError[] = [];
  const groupsByKey = new Map<string, ParsedDepartmentGroup>();
  const groups: ParsedDepartmentGroup[] = [];

  dataRows.forEach((cells, idx) => {
    const spreadsheetRow = idx + 2; // +1 for 0-index, +1 for the header row
    const cell = (c: number) => (c === -1 ? "" : String(cells[c] ?? "").trim());

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
      const existingSub = group.subDepartments.find(
        (s) => s.name.toLowerCase() === subDepartmentName.toLowerCase()
      );
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
      // A category scoped to a sub-department must reference one that's
      // actually defined somewhere in this file for the same department.
      if (
        subDepartmentName &&
        !group.subDepartments.some((s) => s.name.toLowerCase() === subDepartmentName.toLowerCase())
      ) {
        errors.push({
          row: spreadsheetRow,
          reason: `sub_department_name "${subDepartmentName}" could not be added, so category "${categoryName}" was skipped`,
        });
        return;
      }

      const dedupeKey = `${(subDepartmentName || "").toLowerCase()}|${categoryName.toLowerCase()}`;
      const alreadySeen = group.categories.some(
        (c) => `${(c.subDepartmentName || "").toLowerCase()}|${c.name.toLowerCase()}` === dedupeKey
      );
      if (alreadySeen) {
        const scope = subDepartmentName ? `sub-department "${subDepartmentName}"` : "department-wide";
        errors.push({
          row: spreadsheetRow,
          reason: `Duplicate category "${categoryName}" (${scope}) within the file`,
        });
        return;
      }

      const slaMinutes = parseSlaMinutes(cells[categorySlaCol], spreadsheetRow, errors);
      const isWorkStopping = parseBoolean(
        cells[categoryWorkStoppingCol],
        spreadsheetRow,
        "category_is_work_stopping",
        errors
      );
      const isSafetyViolation = parseBoolean(
        cells[categorySafetyCol],
        spreadsheetRow,
        "category_is_safety_violation",
        errors
      );

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

