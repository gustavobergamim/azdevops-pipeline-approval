import * as SDK from "azure-devops-extension-sdk";
import { ReleaseRestClient, ApprovalStatus } from "azure-devops-extension-api/Release";
import { getClient, IProjectPageService, CommonServiceIds } from "azure-devops-extension-api";
import { IReleaseApproval } from "@src-root/core/model/IReleaseApproval";

export class ReleaseApprovalService {

    constructor() { 
        SDK.init();
    }

    public async list(top:number = 50): Promise<IReleaseApproval[]> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (!project) return [];

        let client: ReleaseRestClient = getClient(ReleaseRestClient);
        let approvals = await client.getApprovals(project.name, undefined, undefined, undefined, undefined, top);
        return approvals.map(a => {
            return {
                definition: a.releaseDefinition.name,
                number: a.release.name,
                environment: a.releaseEnvironment.name,
                ...a
            }
        });
    }

    private async changeStatus(approval: IReleaseApproval, approvalStatus: ApprovalStatus, comment: string): Promise<void> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (!project) return;

        let client: ReleaseRestClient = getClient(ReleaseRestClient);
        approval.status = approvalStatus;
        approval.comments = comment;
        await client.updateReleaseApproval(approval, project.name, approval.id);
    }

    public async approve(approval: IReleaseApproval, comment: string): Promise<void> {
        await this.changeStatus(approval, ApprovalStatus.Approved, comment);
    }

    public async reject(approval: IReleaseApproval, comment: string): Promise<void> {
        await this.changeStatus(approval, ApprovalStatus.Rejected, comment);
    }
}