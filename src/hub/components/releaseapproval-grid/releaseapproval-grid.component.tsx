import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { Table, renderSimpleCell, ITableColumn, SimpleTableCell, ColumnSelect } from "azure-devops-ui/Table";
import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { Button } from "azure-devops-ui/Button";
import { Dialog } from "azure-devops-ui/Dialog";
import { Observer } from "azure-devops-ui/Observer";
import { IReleaseApproval } from "../../model/IReleaseApproval";
import { ReleaseApprovalService } from "../../services/release-approval.service";
import { ListSelection, ScrollableList, IListItemDetails, ListItem } from "azure-devops-ui/List";
import { CommonServiceIds, IGlobalMessagesService } from "azure-devops-extension-api";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { ISelectionRange } from "azure-devops-ui/Utilities/Selection";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { PillGroup } from "azure-devops-ui/PillGroup";
import { IColor } from "azure-devops-ui/Utilities/Color";
import Events = require('events');

export default class ReleaseApprovalGrid extends React.Component {

    static events = new Events.EventEmitter();
    static EVENT_APPROVE = "approve";
    static EVENT_REJECT = "reject";

    _releaseService: ReleaseApprovalService = new ReleaseApprovalService();
    _tableRowShimmer = new Array(5).fill(new ObservableValue<IReleaseApproval | undefined>(undefined));
    _tableRowData: ObservableArray<IReleaseApproval> = new ObservableArray<IReleaseApproval>(this._tableRowShimmer);

    selection: ListSelection = new ListSelection({ selectOnFocus: false, multiSelect: true });

    _isDialogOpen: ObservableValue<boolean> = new ObservableValue<boolean>(false);
    _dialogTitleAction: ObservableValue<string> = new ObservableValue<string>("");
    _dialogBodyAction: ObservableValue<string> = new ObservableValue<string>("");
    _dialogActionApprove: ObservableValue<boolean> = new ObservableValue<boolean>(false);
    _selectedReleases: ArrayItemProvider<IReleaseApproval> = new ArrayItemProvider<IReleaseApproval>([]);

    _configureGridColumns(): ITableColumn<{}>[] {
        return [
            new ColumnSelect() as ITableColumn<{}>,
            {
                id: "definition",
                name: "Definition",
                readonly: true,
                renderCell: renderSimpleCell,
                width: -30
            },
            {
                id: "number",
                name: "Identifier",
                readonly: true,
                renderCell: renderSimpleCell,
                width: -20
            },
            {
                id: "environment",
                name: "Stage",
                readonly: true,
                renderCell: renderSimpleCell,
                width: -20
            },
            {
                id: "actions",
                readonly: true,
                renderCell: this._renderStage,
                width: -30
            }
        ]
    };

    constructor(props: {}) {
        super(props);
        ReleaseApprovalGrid.events.on(ReleaseApprovalGrid.EVENT_APPROVE,
            async (approval: IReleaseApproval) => await this._approveSingle(approval));
        ReleaseApprovalGrid.events.on(ReleaseApprovalGrid.EVENT_REJECT,
            async (approval: IReleaseApproval) => await this._rejectSingle(approval));
    }

    render(): JSX.Element {
        const onDismissDialog = () => {
            this._isDialogOpen.value = false;
            this._selectedReleases = new ArrayItemProvider<IReleaseApproval>([]);
        };

        const onConfirmDialog = async () => {
            this._isDialogOpen.value = false;
            if (this._dialogActionApprove) {
                await this._releaseService.approveAll(this._selectedReleases.value, "");
            } else {
                await this._releaseService.rejectAll(this._selectedReleases.value, "");
            }
            this._selectedReleases = new ArrayItemProvider<IReleaseApproval>([]);
            setTimeout(() => this.refreshGrid(), 1000);
        }

        this._loadData();

        return (
            <div className="flex-grow">
                <div>
                    <Table columns={this._configureGridColumns()}
                        itemProvider={this._tableRowData}
                        selection={this.selection}
                        selectRowOnClick={false} />
                    <Observer isDialogOpen={this._isDialogOpen}>
                        {(props: { isDialogOpen: boolean }) => {
                            return props.isDialogOpen ? (
                                <Dialog
                                    titleProps={{ text: `Release ${this._dialogTitleAction.value} confirmation` }}
                                    footerButtonProps={[
                                        {
                                            text: "Cancel",
                                            onClick: onDismissDialog
                                        },
                                        {
                                            text: "Confirm",
                                            onClick: onConfirmDialog,
                                            primary: true
                                        }
                                    ]}
                                    onDismiss={onDismissDialog}
                                >
                                    Confirm that you want to {this._dialogBodyAction.value} the following releases:
                                    <ScrollableList
                                        itemProvider={this._selectedReleases}
                                        renderRow={this._renderListRow}
                                        width="100%"
                                    />
                                </Dialog>
                            ) : null;
                        }}
                    </Observer>
                </div>
            </div>
        );
    }

    _renderStage(
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
                        onClick={() => ReleaseApprovalGrid.events.emit(ReleaseApprovalGrid.EVENT_APPROVE, approval)} />
                    <Button
                        key={"btn-reject-" + approval.id}
                        text="Reject"
                        danger={true}
                        iconProps={{ iconName: "Cancel" }}
                        onClick={() => ReleaseApprovalGrid.events.emit(ReleaseApprovalGrid.EVENT_REJECT, approval)} />
                </ButtonGroup>
            </SimpleTableCell>
        );
    }

    async _loadData(): Promise<void> {
        this._tableRowData.removeAll();
        this._tableRowData.push(...this._tableRowShimmer);
        const approvals = await this._releaseService.listAll();
        this._tableRowData.removeAll();
        this._tableRowData.push(...approvals);
    }

    async refreshGrid(): Promise<void> {
        await this._loadData();
    }

    _approveSingle(approval: IReleaseApproval): void {
        this._selectedReleases = new ArrayItemProvider<IReleaseApproval>([approval]);
        this._approve();
    }

    async approveAll(): Promise<void> {
        if (this.selection.value.length == 0) {
            await this._showErrorMessage("You need to select at least one release to Approve.");
            return;
        }
        this._getSelectedReleases();
        this._approve();
    }

    _approve(): void {
        this._dialogTitleAction.value = "approval";
        this._dialogBodyAction.value = "approve";
        this._dialogActionApprove.value = true;
        this._isDialogOpen.value = true;
    }

    _rejectSingle(approval: IReleaseApproval): void {
        this._selectedReleases = new ArrayItemProvider<IReleaseApproval>([approval]);
        this._reject();
    }

    async rejectAll(): Promise<void> {
        if (this.selection.value.length == 0) {
            await this._showErrorMessage("You need to select at least one release to Reject.");
            return;
        }
        this._getSelectedReleases();
        this._reject();
    }

    _reject(): void {
        this._dialogTitleAction.value = "rejection";
        this._dialogBodyAction.value = "reject";
        this._dialogActionApprove.value = false;
        this._isDialogOpen.value = true;
    }

    _getSelectedReleases(): void {
        this._selectedReleases = new ArrayItemProvider<IReleaseApproval>([]);
        let releases: Array<IReleaseApproval> = new Array<IReleaseApproval>();
        this.selection.value.forEach((range: ISelectionRange, rangeIndex: number) => {
            for (let index: number = range.beginIndex; index <= range.endIndex; index++) {
                releases.push(this._tableRowData.value[index]);
            }
        });
        this._selectedReleases = new ArrayItemProvider<IReleaseApproval>(releases);
    }

    async _showErrorMessage(message: string): Promise<void> {
        const globalMessagesSvc = await SDK.getService<IGlobalMessagesService>(CommonServiceIds.GlobalMessagesService);
        globalMessagesSvc.addToast({
            duration: 3000,
            message: message
        });
    }

    _darkRedColor: IColor = {
        red: 151,
        green: 30,
        blue: 79
    };

    _renderListRow = (
        index: number,
        item: IReleaseApproval,
        details: IListItemDetails<IReleaseApproval>,
        key?: string
    ): JSX.Element => {

        return (
            <ListItem key={key || "list-item" + index} index={index} details={details}>
                <div className="list-example-row flex-row h-scroll-hidden">
                    <div
                        style={{ marginLeft: "10px", padding: "10px 0px" }}
                        className="flex-column h-scroll-hidden"
                    >
                        <PillGroup className="flex-row">
                            <Pill>{item.definition}</Pill>
                            <Pill size={PillSize.compact} variant={PillVariant.outlined}>
                                {item.number}
                            </Pill>
                            <Pill size={PillSize.compact} variant={PillVariant.colored} color={this._darkRedColor}>
                                {item.environment}
                            </Pill>
                        </PillGroup>
                    </div>
                </div>
            </ListItem>
        );
    };

}