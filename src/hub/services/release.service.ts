import * as SDK from "azure-devops-extension-sdk";
import { ReleaseRestClient, ReleaseApproval } from "azure-devops-extension-api/Release";
import { getClient, IProjectPageService, CommonServiceIds } from "azure-devops-extension-api";
import { ReleaseLinks } from "@src-root/hub/model/Release.types";

export class ReleaseService {

    constructor() {
        // SDK.init();
    }

    async getLinks(releaseApproval: ReleaseApproval): Promise<ReleaseLinks | null> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (!project) return null;

        const client: ReleaseRestClient = getClient(ReleaseRestClient);
        const releaseEnvironment = await client.getReleaseEnvironment(project.name, releaseApproval.release.id, releaseApproval.releaseEnvironment.id);
        const releaseDefinitionLink = releaseEnvironment.releaseDefinition._links.web.href;
        const releaseLink = releaseEnvironment.release._links.web.href;
        // const releaseDefinitionLink = releaseEnvironment.releaseDefinition._links.web.href;
        return {
            definition: releaseDefinitionLink,
            release: releaseLink
        };
    }
}