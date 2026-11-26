import { IdentityRef } from "azure-devops-extension-api/WebApi";

/**
 * Types for the "Approvals and Checks" REST API (_apis/pipelines/approvals),
 * which has no typed client in azure-devops-extension-api.
 * The SDK requests enums as numbers, but string values are accepted too.
 */

export const enum PipelineApprovalStatus {
    Undefined = 0,
    Uninitiated = 1,
    Pending = 2,
    Approved = 4,
    Rejected = 8,
    Skipped = 16,
    Canceled = 32,
    TimedOut = 64,
    Failed = 128
}

export const enum PipelineApprovalPermissions {
    None = 0,
    View = 1,
    Update = 2,
    Reassign = 4,
    ResourceAdmin = 8,
    QueueBuild = 16
}

export interface PipelineApprovalStep {
    assignedApprover?: IdentityRef;
    actualApprover?: IdentityRef;
    status?: PipelineApprovalStatus | string;
    comment?: string;
    initiatedOn?: Date;
    lastModifiedOn?: Date;
}

export interface PipelineApprovalOwner {
    id?: number;
    name?: string;
}

export interface PipelineApprovalPipeline {
    id?: string | number;
    name?: string;
    owner?: PipelineApprovalOwner;
}

export interface PipelineApproval {
    id: string;
    status?: PipelineApprovalStatus | string;
    createdOn?: Date;
    lastModifiedOn?: Date;
    instructions?: string;
    minRequiredApprovers?: number;
    permissions?: PipelineApprovalPermissions | string;
    blockedApprovers?: IdentityRef[];
    steps?: PipelineApprovalStep[];
    pipeline?: PipelineApprovalPipeline;
}

export interface PipelineApprovalUpdate {
    approvalId: string;
    status: "approved" | "rejected";
    comment: string;
}

/** A pending YAML stage approval, enriched with its run and stage, ready for the grid. */
export interface YamlApprovalItem {
    id: string;
    approval: PipelineApproval;
    pipelineName: string;
    pipelineId?: number;
    runId?: number;
    runName: string;
    runUrl: string;
    branch: string;
    stageName: string;
    requestedFor?: IdentityRef;
    createdOn?: Date;
    instructions: string;
    pendingApprovers: IdentityRef[];
    minRequiredApprovers: number;
    /** Set when a newer run of the same pipeline and branch waits at the same stage. */
    newerRunName?: string;
}

export interface YamlApprovalActionResult {
    item: YamlApprovalItem;
    error?: string;
}

function sameId(a?: string, b?: string): boolean {
    return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

export function isPendingStatus(status?: PipelineApprovalStatus | string): boolean {
    if (typeof status === "number") return status === PipelineApprovalStatus.Pending;
    return typeof status === "string" && status.toLowerCase() === "pending";
}

function isApprovedStatus(status?: PipelineApprovalStatus | string): boolean {
    if (typeof status === "number") return status === PipelineApprovalStatus.Approved;
    return typeof status === "string" && status.toLowerCase() === "approved";
}

export function hasUpdatePermission(permissions?: PipelineApprovalPermissions | string): boolean {
    if (typeof permissions === "number") return (permissions & PipelineApprovalPermissions.Update) !== 0;
    return typeof permissions === "string" && /\bupdate\b/i.test(permissions);
}

/**
 * True for approvals raised by an "Approvals" check on a stage: they carry the pipeline run that
 * waits on them. Approvals without a run, such as the ones created by the ManualValidation task,
 * can't be shown with context and are left out.
 */
export function isStageApproval(approval: PipelineApproval): boolean {
    return !!approval.pipeline && !!approval.pipeline.owner && typeof approval.pipeline.owner.id === "number";
}

/**
 * True when the current user can still act on the stage approval: it is pending, the server reports
 * the Update permission for the user (this covers group membership), the user is not blocked and has
 * not already approved it.
 */
export function canBeActionedBy(approval: PipelineApproval, userId: string): boolean {
    if (!isStageApproval(approval)) return false;
    if (!isPendingStatus(approval.status)) return false;
    if (approval.permissions === undefined || approval.permissions === null) {
        // Permissions not returned: fall back to a pending step assigned directly to the user.
        const assignedToUser = (approval.steps || []).some(step =>
            step.assignedApprover && sameId(step.assignedApprover.id, userId) && isPendingStatus(step.status));
        if (!assignedToUser) return false;
    } else if (!hasUpdatePermission(approval.permissions)) {
        return false;
    }
    if ((approval.blockedApprovers || []).some(identity => sameId(identity.id, userId))) return false;
    return !(approval.steps || []).some(step =>
        step.actualApprover && sameId(step.actualApprover.id, userId) && isApprovedStatus(step.status));
}

export function getPendingApprovers(approval: PipelineApproval): IdentityRef[] {
    return (approval.steps || [])
        .filter(step => isPendingStatus(step.status) && step.assignedApprover)
        .map(step => step.assignedApprover as IdentityRef);
}

/** Flags older runs when a newer run of the same pipeline and branch waits at the same stage. */
export function flagSupersededRuns(items: YamlApprovalItem[]): void {
    const newest = new Map<string, YamlApprovalItem>();
    const keyOf = (item: YamlApprovalItem) => `${item.pipelineId}|${item.branch}|${item.stageName}`;
    items.filter(item => item.runId !== undefined).forEach(item => {
        const current = newest.get(keyOf(item));
        if (!current || (current.runId as number) < (item.runId as number)) {
            newest.set(keyOf(item), item);
        }
    });
    items.forEach(item => {
        const latest = newest.get(keyOf(item));
        item.newerRunName = latest && latest.runId !== item.runId ? latest.runName : undefined;
    });
}
