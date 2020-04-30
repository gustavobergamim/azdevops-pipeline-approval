import * as SDK from "azure-devops-extension-sdk";
import { ReleaseRestClient, ReleaseApproval, DeploymentStatus, DeploymentOperationStatus } from "azure-devops-extension-api/Release";
import { getClient, IProjectPageService, CommonServiceIds } from "azure-devops-extension-api";

export class ReleaseService {

    async getLinks(releaseApproval: ReleaseApproval): Promise<void> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (!project) return;

        const client: ReleaseRestClient = getClient(ReleaseRestClient);

        const deployments = await client.getDeployments(project.name, releaseApproval.releaseDefinition.id, undefined
            , undefined, undefined, undefined, DeploymentStatus.NotDeployed, DeploymentOperationStatus.Pending);
        const deployment = deployments.find(d => d.release.id === releaseApproval.release.id && d.releaseEnvironment.id === releaseApproval.releaseEnvironment.id);
        if (!deployment) return;

        releaseApproval.releaseDefinition._links = deployment.releaseDefinition._links;
        releaseApproval.release._links = deployment.release._links;
        releaseApproval.releaseEnvironment._links = deployment.releaseEnvironment._links;
    }
}