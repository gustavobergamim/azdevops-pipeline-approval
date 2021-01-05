import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IExtensionDataService, IExtensionDataManager, IDocumentOptions } from "azure-devops-extension-api";

export class UserService {

    private _dataScope: IDocumentOptions = { scopeType: "User" };

    isLoggedUser(id: string): boolean {
        return SDK.getUser().id === id;
    }

    private async getDataManager(): Promise<IExtensionDataManager | undefined> {
        const extensionContext = SDK.getExtensionContext();
        const accessToken = await SDK.getAccessToken();
        const dataService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);
        return await dataService?.getExtensionDataManager(extensionContext?.extensionId, accessToken);
    }

    async setData(key: string, value: any) {
        const dataManager = await this.getDataManager();
        await dataManager?.setValue(key, value, this._dataScope);
    }

    async getData(key: string): Promise<any> {
        const dataManager = await this.getDataManager();
        return await dataManager?.getValue(key, this._dataScope);
    }
}