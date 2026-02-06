import { ReleaseApproval } from "azure-devops-extension-api/Release";
import { IObservableArrayEventArgs, IReadonlyObservableValue, ObservableArray, ObservableArrayAction, ObservableValue } from "azure-devops-ui/Core/Observable";
import { ArrayItemProvider, IItemProvider } from "azure-devops-ui/Utilities/Provider";

export class ReleaseApprovalItemProvider implements IItemProvider<ReleaseApproval | IReadonlyObservableValue<ReleaseApproval | undefined>> {

    private internalItemProvider: ObservableArray<ReleaseApproval | ObservableValue<ReleaseApproval | undefined>>;

    length: number;
    value: (ReleaseApproval | IReadonlyObservableValue<ReleaseApproval | undefined>)[];

    constructor(initialItems?: ReleaseApproval[]) {
        this.internalItemProvider = new ObservableArray<ReleaseApproval | ObservableValue<ReleaseApproval | undefined>>(initialItems || []);
        this.length = this.internalItemProvider.length;
        this.value = this.internalItemProvider.value;
    }

    getItem = (index: number): ReleaseApproval | IReadonlyObservableValue<ReleaseApproval | undefined> | undefined => {
        return this.internalItemProvider.value[index];
    };

    push(...items: (ReleaseApproval | ObservableValue<ReleaseApproval | undefined>)[]): void {
        this.internalItemProvider.push(...items);
        this.length = this.internalItemProvider.length;
        this.value = this.internalItemProvider.value;
    }

    pop(): void {
        this.internalItemProvider.pop();
        this.length = this.internalItemProvider.length;
        this.value = this.internalItemProvider.value;
    }
    removeAll(): void {
        this.internalItemProvider.removeAll();
        this.length = this.internalItemProvider.length;
        this.value = this.internalItemProvider.value;
    }       

    subscribe(observer: (value: IObservableArrayEventArgs<ReleaseApproval | IReadonlyObservableValue<ReleaseApproval | undefined>>, action?: ObservableArrayAction | undefined) => void, action?: ObservableArrayAction | undefined) {
        return this.internalItemProvider.subscribe(observer, action) as () => void;
    }

    unsubscribe(observer: (value: IObservableArrayEventArgs<ReleaseApproval | IReadonlyObservableValue<ReleaseApproval | undefined>>, action?: ObservableArrayAction | undefined) => void, action?: ObservableArrayAction | undefined) {
        return this.internalItemProvider.unsubscribe(observer, action);
    }
}