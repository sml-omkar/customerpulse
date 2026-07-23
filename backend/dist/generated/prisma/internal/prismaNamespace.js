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
exports.defineExtension = exports.JsonNullValueFilter = exports.NullsOrder = exports.QueryMode = exports.NullableJsonNullValueInput = exports.SortOrder = exports.AdminMessageScalarFieldEnum = exports.PasswordResetOtpScalarFieldEnum = exports.InvitationScalarFieldEnum = exports.AuditLogScalarFieldEnum = exports.TicketStatusHistoryScalarFieldEnum = exports.TicketEscalationScalarFieldEnum = exports.TicketAttachmentScalarFieldEnum = exports.TicketCommentScalarFieldEnum = exports.TicketScalarFieldEnum = exports.TicketCategoryScalarFieldEnum = exports.PriorityConfigScalarFieldEnum = exports.CategoryAgentScalarFieldEnum = exports.TicketKeywordScalarFieldEnum = exports.UserKeywordScalarFieldEnum = exports.KeywordSuggestionScalarFieldEnum = exports.KeywordScalarFieldEnum = exports.UserScalarFieldEnum = exports.SubDepartmentScalarFieldEnum = exports.DepartmentScalarFieldEnum = exports.ProjectScalarFieldEnum = exports.ClientScalarFieldEnum = exports.TransactionIsolationLevel = exports.ModelName = exports.AnyNull = exports.JsonNull = exports.DbNull = exports.NullTypes = exports.prismaVersion = exports.getExtensionContext = exports.Decimal = exports.Sql = exports.raw = exports.join = exports.empty = exports.sql = exports.PrismaClientValidationError = exports.PrismaClientInitializationError = exports.PrismaClientRustPanicError = exports.PrismaClientUnknownRequestError = exports.PrismaClientKnownRequestError = void 0;
const runtime = __importStar(require("@prisma/client/runtime/client"));
exports.PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
exports.PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
exports.PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
exports.PrismaClientInitializationError = runtime.PrismaClientInitializationError;
exports.PrismaClientValidationError = runtime.PrismaClientValidationError;
exports.sql = runtime.sqltag;
exports.empty = runtime.empty;
exports.join = runtime.join;
exports.raw = runtime.raw;
exports.Sql = runtime.Sql;
exports.Decimal = runtime.Decimal;
exports.getExtensionContext = runtime.Extensions.getExtensionContext;
exports.prismaVersion = {
    client: "7.8.0",
    engine: "3c6e192761c0362d496ed980de936e2f3cebcd3a"
};
exports.NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
exports.DbNull = runtime.DbNull;
exports.JsonNull = runtime.JsonNull;
exports.AnyNull = runtime.AnyNull;
exports.ModelName = {
    Client: 'Client',
    Project: 'Project',
    Department: 'Department',
    SubDepartment: 'SubDepartment',
    User: 'User',
    Keyword: 'Keyword',
    KeywordSuggestion: 'KeywordSuggestion',
    UserKeyword: 'UserKeyword',
    TicketKeyword: 'TicketKeyword',
    CategoryAgent: 'CategoryAgent',
    PriorityConfig: 'PriorityConfig',
    TicketCategory: 'TicketCategory',
    Ticket: 'Ticket',
    TicketComment: 'TicketComment',
    TicketAttachment: 'TicketAttachment',
    TicketEscalation: 'TicketEscalation',
    TicketStatusHistory: 'TicketStatusHistory',
    AuditLog: 'AuditLog',
    Invitation: 'Invitation',
    PasswordResetOtp: 'PasswordResetOtp',
    AdminMessage: 'AdminMessage'
};
exports.TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
exports.ClientScalarFieldEnum = {
    id: 'id',
    name: 'name',
    isKeyClient: 'isKeyClient',
    isWindClient: 'isWindClient',
    createdAt: 'createdAt'
};
exports.ProjectScalarFieldEnum = {
    id: 'id',
    name: 'name',
    isShutdownJob: 'isShutdownJob',
    createdAt: 'createdAt',
    clientId: 'clientId'
};
exports.DepartmentScalarFieldEnum = {
    id: 'id',
    name: 'name',
    description: 'description',
    createdAt: 'createdAt',
    managerId: 'managerId',
    cxoId: 'cxoId'
};
exports.SubDepartmentScalarFieldEnum = {
    id: 'id',
    departmentId: 'departmentId',
    name: 'name',
    description: 'description',
    createdAt: 'createdAt'
};
exports.UserScalarFieldEnum = {
    id: 'id',
    email: 'email',
    fullName: 'fullName',
    employeeId: 'employeeId',
    state: 'state',
    windCategory: 'windCategory',
    ssoProvider: 'ssoProvider',
    ssoExternalId: 'ssoExternalId',
    passwordHash: 'passwordHash',
    agentsdepartmentId: 'agentsdepartmentId',
    role: 'role',
    supportLevel: 'supportLevel',
    isActive: 'isActive',
    onboardedById: 'onboardedById',
    approvalStatus: 'approvalStatus',
    isAvailableForAssignment: 'isAvailableForAssignment',
    maxActiveTickets: 'maxActiveTickets',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.KeywordScalarFieldEnum = {
    id: 'id',
    departmentId: 'departmentId',
    name: 'name',
    description: 'description',
    synonyms: 'synonyms',
    createdAt: 'createdAt'
};
exports.KeywordSuggestionScalarFieldEnum = {
    id: 'id',
    departmentId: 'departmentId',
    term: 'term',
    occurrenceCount: 'occurrenceCount',
    status: 'status',
    promotedKeywordId: 'promotedKeywordId',
    reviewedById: 'reviewedById',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.UserKeywordScalarFieldEnum = {
    userId: 'userId',
    keywordId: 'keywordId',
    proficiency: 'proficiency'
};
exports.TicketKeywordScalarFieldEnum = {
    ticketId: 'ticketId',
    keywordId: 'keywordId'
};
exports.CategoryAgentScalarFieldEnum = {
    id: 'id',
    categoryId: 'categoryId',
    userId: 'userId',
    proficiency: 'proficiency',
    createdAt: 'createdAt'
};
exports.PriorityConfigScalarFieldEnum = {
    priority: 'priority',
    updatedAt: 'updatedAt'
};
exports.TicketCategoryScalarFieldEnum = {
    id: 'id',
    departmentId: 'departmentId',
    subDepartmentId: 'subDepartmentId',
    name: 'name',
    defaultSlaMinutes: 'defaultSlaMinutes',
    defaultPriority: 'defaultPriority',
    isWorkStopping: 'isWorkStopping',
    isSafetyViolation: 'isSafetyViolation'
};
exports.TicketScalarFieldEnum = {
    id: 'id',
    ticketNumber: 'ticketNumber',
    title: 'title',
    description: 'description',
    requesterId: 'requesterId',
    departmentId: 'departmentId',
    categoryId: 'categoryId',
    representative: 'representative',
    employeeId: 'employeeId',
    clientName: 'clientName',
    clientEmail: 'clientEmail',
    dateOfOccurance: 'dateOfOccurance',
    site: 'site',
    state: 'state',
    turnoverRate: 'turnoverRate',
    designation: 'designation',
    projectId: 'projectId',
    status: 'status',
    priority: 'priority',
    internalPriority: 'internalPriority',
    assigneeId: 'assigneeId',
    assignedById: 'assignedById',
    assignmentMethod: 'assignmentMethod',
    assignedAt: 'assignedAt',
    supportLevel: 'supportLevel',
    escalatedToId: 'escalatedToId',
    escalatedAt: 'escalatedAt',
    escalationReason: 'escalationReason',
    dueDate: 'dueDate',
    slaDeadline: 'slaDeadline',
    slaBreached: 'slaBreached',
    resolvedAt: 'resolvedAt',
    closedAt: 'closedAt',
    holdStartedAt: 'holdStartedAt',
    totalHoldMinutes: 'totalHoldMinutes',
    resolvedStartedAt: 'resolvedStartedAt',
    totalResolvedMinutes: 'totalResolvedMinutes',
    slaRemainingMinutes: 'slaRemainingMinutes',
    slaTotalMinutes: 'slaTotalMinutes',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    turnOverTime: 'turnOverTime',
    ticketTurnOverTime: 'ticketTurnOverTime'
};
exports.TicketCommentScalarFieldEnum = {
    id: 'id',
    ticketId: 'ticketId',
    userId: 'userId',
    commentText: 'commentText',
    isInternal: 'isInternal',
    createdAt: 'createdAt',
    attachmentId: 'attachmentId'
};
exports.TicketAttachmentScalarFieldEnum = {
    id: 'id',
    ticketId: 'ticketId',
    fileName: 'fileName',
    fileUrl: 'fileUrl',
    uploadedBy: 'uploadedBy',
    createdAt: 'createdAt'
};
exports.TicketEscalationScalarFieldEnum = {
    id: 'id',
    ticketId: 'ticketId',
    fromLevel: 'fromLevel',
    toLevel: 'toLevel',
    escalatedById: 'escalatedById',
    escalatedToId: 'escalatedToId',
    reason: 'reason',
    isAutomatic: 'isAutomatic',
    createdAt: 'createdAt'
};
exports.TicketStatusHistoryScalarFieldEnum = {
    id: 'id',
    ticketId: 'ticketId',
    fromStatus: 'fromStatus',
    status: 'status',
    changedById: 'changedById',
    changedAt: 'changedAt',
    note: 'note',
    durationInPrevStatusMinutes: 'durationInPrevStatusMinutes'
};
exports.AuditLogScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    action: 'action',
    entityType: 'entityType',
    entityId: 'entityId',
    createdAt: 'createdAt'
};
exports.InvitationScalarFieldEnum = {
    id: 'id',
    name: 'name',
    email: 'email',
    invitedById: 'invitedById',
    role: 'role',
    Password: 'Password',
    state: 'state',
    windCategory: 'windCategory',
    supportLevel: 'supportLevel',
    status: 'status',
    token: 'token',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt'
};
exports.PasswordResetOtpScalarFieldEnum = {
    id: 'id',
    email: 'email',
    otpHash: 'otpHash',
    expiresAt: 'expiresAt',
    attempts: 'attempts',
    verified: 'verified',
    consumedAt: 'consumedAt',
    createdAt: 'createdAt'
};
exports.AdminMessageScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    fromAdminId: 'fromAdminId',
    message: 'message',
    isRead: 'isRead',
    createdAt: 'createdAt'
};
exports.SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
exports.NullableJsonNullValueInput = {
    DbNull: exports.DbNull,
    JsonNull: exports.JsonNull
};
exports.QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
exports.NullsOrder = {
    first: 'first',
    last: 'last'
};
exports.JsonNullValueFilter = {
    DbNull: exports.DbNull,
    JsonNull: exports.JsonNull,
    AnyNull: exports.AnyNull
};
exports.defineExtension = runtime.Extensions.defineExtension;
//# sourceMappingURL=prismaNamespace.js.map