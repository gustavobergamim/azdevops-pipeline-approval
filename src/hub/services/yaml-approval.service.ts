import * as SDK from "azure-devops-extension-sdk";
import { getClient, IProjectPageService, CommonServiceIds, ILocationService, IProjectInfo } from "azure-devops-extension-api";
import { BuildRestClient, Build, TimelineRecord } from "azure-devops-extension-api/Build";
import {
    PipelineApproval,
    PipelineApprovalUpdate,
    YamlApprovalItem,
    YamlApprovalActionResult,
    canBeActionedBy,
    getPendingApprovers,
    flagSupersededRuns
} from "@src-root/hub/model/YamlApproval";
import { chunk, mapWithConcurrency, errorMessage } from "@src-root/hub/services/async";

const APPROVALS_API_VERSION = "7.1";
/** The approvals query has no paging; a full page means some approvals may be missing. */
export const YAML_APPROVALS_TOP = 1000;
const RUNS_BATCH_SIZE = 100;
const REQUEST_CONCURRENCY = 4;

async function getCollectionUrl(): Promise<string> {
    const locationService = await SDK.getService<ILocationService>(CommonServiceIds.LocationService);
    const url = await locationService.getServiceLocation();
    return url.endsWith("/") ? url : url + "/";
}

function toDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Client for the "Approvals and Checks" API (scopes: vso.build to read, vso.build_execute to update).
 * azure-devops-extension-api has no client for it and doesn't export RestClientBase, so it calls the
 * documented endpoint directly with the extension's access token. Only Azure DevOps URLs are called.
 */
export class PipelineApprovalsClient {

    async queryPendingApprovals(project: string, top: number): Promise<PipelineApproval[]> {
        const query = `state=pending&$expand=steps,permissions&top=${top}`;
        const data = await this.request<{ value?: PipelineApproval[] } | PipelineApproval[]>("GET", project, query);
        const approvals = Array.isArray(data) ? data : (data && data.value) || [];
        approvals.forEach(approval => {
            approval.createdOn = toDate(approval.createdOn);
            approval.lastModifiedOn = toDate(approval.lastModifiedOn);
        });
        return approvals;
    }

    async updateApprovals(project: string, updates: PipelineApprovalUpdate[]): Promise<void> {
        await this.request<any>("PATCH", project, "", updates);
    }

    private async request<T>(method: "GET" | "PATCH", project: string, query: string, body?: any): Promise<T> {
        const [collectionUrl, accessToken] = await Promise.all([getCollectionUrl(), SDK.getAccessToken()]);
        const url = `${collectionUrl}${encodeURIComponent(project)}/_apis/pipelines/approvals`
            + `?${query ? query + "&" : ""}api-version=${APPROVALS_API_VERSION}`;
        const response = await fetch(url, {
            method,
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: body !== undefined ? JSON.stringify(body) : undefined
        });
        const text = await response.text();
        let data: any = undefined;
        try {
            data = text ? JSON.parse(text) : undefined;
        } catch {
            throw new Error(`Unexpected response from Azure DevOps (HTTP ${response.status}). Refresh the page and try again.`);
        }
        if (!response.ok) {
            throw new Error((data && data.message) || `HTTP ${response.status} ${response.statusText}`);
        }
        return data as T;
    }
}

export interface IYamlApprovalsResult {
    items: YamlApprovalItem[];
    /** True when the query hit YAML_APPROVALS_TOP, so some approvals may not be listed. */
    truncated: boolean;
}

export class YamlApprovalService {

    private _approvalsClient = new PipelineApprovalsClient();

    private async getProject(): Promise<IProjectInfo | undefined> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        return await projectService.getProject();
    }

    /** Pending YAML stage approvals in the current project that the signed-in user can approve or reject. */
    async findPendingApprovals(): Promise<IYamlApprovalsResult> {
        const project = await this.getProject();
        if (!project) return { items: [], truncated: false };

        const userId = SDK.getUser().id;
        const approvals = await this._approvalsClient.queryPendingApprovals(project.name, YAML_APPROVALS_TOP);
        const truncated = approvals.length >= YAML_APPROVALS_TOP;
        const actionable = approvals.filter(approval => canBeActionedBy(approval, userId));

        const runIds = actionable
            .map(approval => approval.pipeline && approval.pipeline.owner && approval.pipeline.owner.id)
            .filter((id, index, all): id is number => typeof id === "number" && all.indexOf(id) === index);

        const [runs, stages, collectionUrl] = await Promise.all([
            this.findRuns(project.name, runIds),
            this.findStageNames(project.name, runIds),
            getCollectionUrl()
        ]);

        const items = actionable.map(approval => this.toItem(approval, runs, stages, collectionUrl, project.name));
        flagSupersededRuns(items);
        items.sort((a, b) => (b.createdOn ? b.createdOn.getTime() : 0) - (a.createdOn ? a.createdOn.getTime() : 0));
        return { items, truncated };
    }

    async approveAll(items: YamlApprovalItem[], comment: string): Promise<YamlApprovalActionResult[]> {
        return this.updateAll(items, "approved", comment);
    }

    async rejectAll(items: YamlApprovalItem[], comment: string): Promise<YamlApprovalActionResult[]> {
        return this.updateAll(items, "rejected", comment);
    }

    /** One request per approval, so each failure (e.g. no permission, already completed) is reported on its own. */
    private async updateAll(items: YamlApprovalItem[], status: "approved" | "rejected", comment: string): Promise<YamlApprovalActionResult[]> {
        const project = await this.getProject();
        if (!project) {
            return items.map(item => ({ item, error: "Project not found." }));
        }
        return mapWithConcurrency(items, REQUEST_CONCURRENCY, async (item): Promise<YamlApprovalActionResult> => {
            try {
                await this._approvalsClient.updateApprovals(project.name, [{ approvalId: item.id, status, comment }]);
                return { item };
            } catch (error) {
                return { item, error: errorMessage(error) };
            }
        });
    }

    private async findRuns(project: string, runIds: number[]): Promise<Map<number, Build>> {
        const runs = new Map<number, Build>();
        if (runIds.length === 0) return runs;
        const client = getClient(BuildRestClient);
        for (const batch of chunk(runIds, RUNS_BATCH_SIZE)) {
            const builds = await client.getBuilds(project, undefined, undefined, undefined, undefined, undefined,
                undefined, undefined, undefined, undefined, undefined, undefined, batch.length, undefined, undefined,
                undefined, undefined, undefined, batch);
            (builds || []).forEach(build => runs.set(build.id, build));
        }
        return runs;
    }

    /** Maps approval id → stage name, walking each run timeline from the approval checkpoint up to its stage. */
    private async findStageNames(project: string, runIds: number[]): Promise<Map<string, string>> {
        const stages = new Map<string, string>();
        const client = getClient(BuildRestClient);
        await mapWithConcurrency(runIds, REQUEST_CONCURRENCY, async runId => {
            try {
                const timeline = await client.getBuildTimeline(project, runId);
                const records = (timeline && timeline.records) || [];
                const byId = new Map<string, TimelineRecord>();
                records.filter(record => record && record.id).forEach(record => byId.set(record.id.toLowerCase(), record));
                records
                    .filter(record => record && record.type === "Checkpoint.Approval")
                    .forEach(record => {
                        const stage = this.findStage(record, byId);
                        if (stage) stages.set(record.id.toLowerCase(), stage.name || stage.identifier);
                    });
            } catch {
                // Without the timeline the stage column stays empty; the approval can still be actioned.
            }
        });
        return stages;
    }

    private findStage(record: TimelineRecord, byId: Map<string, TimelineRecord>): TimelineRecord | undefined {
        let current: TimelineRecord | undefined = record;
        for (let depth = 0; current && depth < 10; depth++) {
            if (current.type === "Stage") return current;
            current = current.parentId ? byId.get(current.parentId.toLowerCase()) : undefined;
        }
        return undefined;
    }

    private toItem(approval: PipelineApproval, runs: Map<number, Build>, stages: Map<string, string>,
        collectionUrl: string, projectName: string): YamlApprovalItem {
        const owner = approval.pipeline && approval.pipeline.owner;
        const runId = owner && owner.id;
        const run = runId !== undefined ? runs.get(runId) : undefined;
        const pipelineName = (run && run.definition && run.definition.name)
            || (approval.pipeline && approval.pipeline.name) || "Pipeline";
        const runName = (run && run.buildNumber) || (owner && owner.name) || (runId !== undefined ? String(runId) : "");
        const runUrl = runId !== undefined
            ? `${collectionUrl}${encodeURIComponent(projectName)}/_build/results?buildId=${runId}&view=results`
            : "";
        return {
            id: approval.id,
            approval,
            pipelineName,
            pipelineId: run && run.definition ? run.definition.id : undefined,
            runId,
            runName,
            runUrl,
            branch: run && run.sourceBranch ? run.sourceBranch.replace(/^refs\/heads\//, "") : "",
            stageName: stages.get(approval.id.toLowerCase()) || "",
            requestedFor: run ? run.requestedFor : undefined,
            createdOn: approval.createdOn,
            instructions: approval.instructions || "",
            pendingApprovers: getPendingApprovers(approval),
            minRequiredApprovers: approval.minRequiredApprovers || 1
        };
    }
}
