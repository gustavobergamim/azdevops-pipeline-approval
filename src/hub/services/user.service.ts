import * as SDK from "azure-devops-extension-sdk";

export class UserService {

    constructor() {
        // SDK.init();
    }

    isLoggedUser(id: string): boolean {
        return SDK.getUser().id === id;
    }
}