import { ReleaseApproval } from "azure-devops-extension-api/Release";

export interface IReleaseApproval extends ReleaseApproval {
    definition: string;
    number: string;
    environment: string;
}