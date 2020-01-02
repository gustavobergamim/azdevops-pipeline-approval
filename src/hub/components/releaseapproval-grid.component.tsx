import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { Table, renderSimpleCell, ITableColumn, SimpleTableCell, ColumnSelect } from "azure-devops-ui/Table";
import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { Button } from "azure-devops-ui/Button";
import { IReleaseApproval } from "@src-root/hub/model/IReleaseApproval";
import { ReleaseApprovalService } from "@src-root/hub/services/release-approval.service";
import { ListSelection } from "azure-devops-ui/List";
import { CommonServiceIds, IGlobalMessagesService } from "azure-devops-extension-api";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { ISelectionRange } from "azure-devops-ui/Utilities/Selection";
import ReleaseApprovalDialog from "@src-root/hub/components/releaseapproval-dialog.component";
import { ReleaseApprovalAction } from "@src-root/hub/model/ReleaseApprovalAction";
import { ReleaseApprovalEvents, EventType } from "@src-root/hub/model/ReleaseApprovalEvents";

export default class ReleaseApprovalGrid extends React.Component {

    private _releaseService: ReleaseApprovalService = new ReleaseApprovalService();
    private _tableRowShimmer = new Array(5).fill(new ObservableValue<IReleaseApproval | undefined>(undefined));
    private _tableRowData: ObservableArray<IReleaseApproval> = new ObservableArray<IReleaseApproval>(this._tableRowShimmer);
    private _selection: ListSelection = new ListSelection({ selectOnFocus: false, multiSelect: true });
    private _selectedReleases: ArrayItemProvider<IReleaseApproval> = new ArrayItemProvider<IReleaseApproval>([]);
    private _dialog: React.RefObject<ReleaseApprovalDialog>;
    private get dialog() {
        return this._dialog.current as ReleaseApprovalDialog;
    }
    private _action: ObservableValue<ReleaseApprovalAction> = new ObservableValue<ReleaseApprovalAction>(ReleaseApprovalAction.Reject);

    private _configureGridColumns(): ITableColumn<{}>[] {
        return [
            new ColumnSelect() as ITableColumn<{}>,
            {
                id: "definition",
                name: "Definition",
                renderCell: renderSimpleCell,
                width: -30
            },
            {
                id: "number",
                name: "Identifier",
                renderCell: renderSimpleCell,
                width: -20
            },
            {
                id: "environment",
                name: "Stage",
                renderCell: renderSimpleCell,
                width: -20
            },
            {
                id: "actions",
                renderCell: this._renderStage,
                width: -30
            }
        ]
    };

    constructor(props: {}) {
        super(props);
        this._dialog = React.createRef();
        this.subscribeEvents();
    }

    private subscribeEvents(): void {
        ReleaseApprovalEvents.subscribe(EventType.RefreshGrid, async () => {
            await this.refreshGrid();
        });
        ReleaseApprovalEvents.subscribe(EventType.ClearGridSelection, () => {
            this._selectedReleases = new ArrayItemProvider<IReleaseApproval>([]);
        });
        ReleaseApprovalEvents.subscribe(EventType.ApproveAllReleases, async () => {
            await this.approveAll();
        });
        ReleaseApprovalEvents.subscribe(EventType.ApproveSingleRelease, (approval: IReleaseApproval) => {
            this._approveSingle(approval);
        });
        ReleaseApprovalEvents.subscribe(EventType.RejectAllReleases, async () => {
            await this.rejectAll();
        });
        ReleaseApprovalEvents.subscribe(EventType.RejectSingleRelease, (approval: IReleaseApproval) => {
            this._rejectSingle(approval);
        });
    }

    render(): JSX.Element {
        this._loadData();
        return (
            <div className="flex-grow">
                <div>
                    <Table columns={this._configureGridColumns()}
                        itemProvider={this._tableRowData}
                        selection={this._selection} />
                    <ReleaseApprovalDialog
                        ref={this._dialog}
                        action={this._action} />
                </div>
            </div>
        );
    }

    private _renderStage(
        rowIndex: number,
        columnIndex: number,
        tableColumn: ITableColumn<{}>,
        tableItem: any
    ): JSX.Element {
        const approval: IReleaseApproval = tableItem;
        return (
            <SimpleTableCell
                columnIndex={columnIndex}
                tableColumn={tableColumn}
                key={"col-" + columnIndex}>
                <ButtonGroup>
                    <Button
                        key={"btn-approve-" + approval.id}
                        text="Approve"
                        primary={true}
                        iconProps={{ iconName: "CheckMark" }}
                        onClick={() => ReleaseApprovalEvents.fire(EventType.ApproveSingleRelease, approval)} />
                    <Button
                        key={"btn-reject-" + approval.id}
                        text="Reject"
                        danger={true}
                        iconProps={{ iconName: "Cancel" }}
                        onClick={() => ReleaseApprovalEvents.fire(EventType.RejectSingleRelease, approval)} />
                </ButtonGroup>
            </SimpleTableCell>
        );
    }

    private async _loadData(): Promise<void> {
        this._tableRowData.removeAll();
        this._tableRowData.push(...this._tableRowShimmer);
        const approvals = await this._releaseService.listAll();
        this._tableRowData.removeAll();
        this._tableRowData.push(...approvals);
    }

    async refreshGrid(): Promise<void> {
        await this._loadData();
    }

    private _approveSingle(approval: IReleaseApproval): void {
        this._selectedReleases = new ArrayItemProvider<IReleaseApproval>([approval]);
        this._approve();
    }

    async approveAll(): Promise<void> {
        if (this._selection.value.length == 0) {
            await this._showErrorMessage("You need to select at least one release to Approve.");
            return;
        }
        this._getSelectedReleases();
        this._approve();
    }

    private _approve(): void {
        this._action.value = ReleaseApprovalAction.Approve;
        this.dialog.openDialog(this._selectedReleases);
    }

    private _rejectSingle(approval: IReleaseApproval): void {
        this._selectedReleases = new ArrayItemProvider<IReleaseApproval>([approval]);
        this._reject();
    }

    async rejectAll(): Promise<void> {
        if (this._selection.value.length == 0) {
            await this._showErrorMessage("You need to select at least one release to Reject.");
            return;
        }
        this._getSelectedReleases();
        this._reject();
    }

    private _reject(): void {
        this._action.value = ReleaseApprovalAction.Reject;
        this.dialog.openDialog(this._selectedReleases);
    }

    private _getSelectedReleases(): void {
        this._selectedReleases = new ArrayItemProvider<IReleaseApproval>([]);
        let releases: Array<IReleaseApproval> = new Array<IReleaseApproval>();
        this._selection.value.forEach((range: ISelectionRange, rangeIndex: number) => {
            for (let index: number = range.beginIndex; index <= range.endIndex; index++) {
                releases.push(this._tableRowData.value[index]);
            }
        });
        this._selectedReleases = new ArrayItemProvider<IReleaseApproval>(releases);
    }

    private async _showErrorMessage(message: string): Promise<void> {
        const globalMessagesSvc = await SDK.getService<IGlobalMessagesService>(CommonServiceIds.GlobalMessagesService);
        globalMessagesSvc.addToast({
            duration: 3000,
            message: message
        });
    }
}