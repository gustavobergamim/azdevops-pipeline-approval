import * as SDK from "azure-devops-extension-sdk";
import { ReleaseRestClient, ReleaseApproval, DeploymentStatus, DeploymentOperationStatus } from "azure-devops-extension-api/Release";
import { getClient, IProjectPageService, CommonServiceIds } from "azure-devops-extension-api";

export class ReleaseService {

    async fillLinks(approvals: ReleaseApproval[]): Promise<void> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (!project) return;
        const client: ReleaseRestClient = getClient(ReleaseRestClient);

        let releaseDefinitionsIds = this.getReleaseDefinitionsIds(approvals);

        const promises = releaseDefinitionsIds.map(async id => await client.getDeployments(project.name, id, undefined
            , undefined, undefined, undefined, DeploymentStatus.NotDeployed, DeploymentOperationStatus.Pending));
        const deploymentsMatrix = await Promise.all(promises);

        const deployments = deploymentsMatrix.reduce((acumulator, current) => acumulator.concat(current));
        if (!deployments) return;

        approvals.forEach(a => {
            const deployment = deployments.find(d => d.release.id === a.release.id && d.releaseEnvironment.id === a.releaseEnvironment.id);
            if (!deployment) return;

            a.releaseDefinition._links = deployment.releaseDefinition._links;
            a.release._links = deployment.release._links;
            a.releaseEnvironment._links = deployment.releaseEnvironment._links;
        });
    }

    private getReleaseDefinitionsIds(approvals: ReleaseApproval[]) {
        let releasesDefinitionIds = approvals.map(a => a.releaseDefinition.id);
        releasesDefinitionIds = releasesDefinitionIds.filter((id, index) => releasesDefinitionIds.indexOf(id) === index);
        return releasesDefinitionIds;
    }
}