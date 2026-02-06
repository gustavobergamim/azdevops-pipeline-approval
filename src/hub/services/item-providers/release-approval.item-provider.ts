import { IObservableArrayEventArgs, IReadonlyObservableArray, IReadonlyObservableValue, ObservableArrayAction } from "azure-devops-ui/Core/Observable";
import { ISimpleTableCell } from "azure-devops-ui/Table";
import { IItemProvider } from "azure-devops-ui/Utilities/Provider";

export interface IReleaseApprovalTableItem extends ISimpleTableCell {
    id: number;
    releaseDefinition: ISimpleTableCell;
    releaseEnvironment: ISimpleTableCell;
    approvalType: ISimpleTableCell;
}

export class ReleaseApprovalItemProvider implements IItemProvider<IReleaseApprovalTableItem | IReadonlyObservableValue<IReleaseApprovalTableItem | undefined>> {
    getItem?: ((index: number) => IReleaseApprovalTableItem | IReadonlyObservableValue<IReleaseApprovalTableItem | undefined> | undefined) | undefined;
    length: number;
    value: (IReleaseApprovalTableItem | IReadonlyObservableValue<IReleaseApprovalTableItem | undefined>)[];
    subscribe?: ((observer: (value: IObservableArrayEventArgs<IReleaseApprovalTableItem | IReadonlyObservableValue<IReleaseApprovalTableItem | undefined>>, action?: ObservableArrayAction | undefined) => void, action?: ObservableArrayAction | undefined) => (value: IObservableArrayEventArgs<IReleaseApprovalTableItem | IReadonlyObservableValue<IReleaseApprovalTableItem | undefined>>, action?: ObservableArrayAction | undefined) => void) | undefined;
    unsubscribe?: ((observer: (value: IObservableArrayEventArgs<IReleaseApprovalTableItem | IReadonlyObservableValue<IReleaseApprovalTableItem | undefined>>, action?: ObservableArrayAction | undefined) => void, action?: ObservableArrayAction | undefined) => void) | undefined;


}