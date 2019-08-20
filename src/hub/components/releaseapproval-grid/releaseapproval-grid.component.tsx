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
import { ListSelection } from "azure-devops-ui/List";
import { CommonServiceIds, IGlobalMessagesService } from "azure-devops-extension-api";

export default class ReleaseApprovalGrid extends React.Component {

    _releaseService: ReleaseApprovalService = new ReleaseApprovalService();
    _tableRowData: ObservableArray<IReleaseApproval> = new ObservableArray<IReleaseApproval>([]);
    selection: ListSelection = new ListSelection({ selectOnFocus: false, multiSelect: true });

    _isDialogOpen = new ObservableValue<boolean>(false);
    _dialogTitle = new ObservableValue<string>("");

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
                name: "Actions",
                readonly: true,
                renderCell: this._renderStage,
                width: -30
            }
        ]
    };

    render(): JSX.Element {
        const onDismissDialog = () => {
            this._isDialogOpen.value = false;
        };

        const onConfirmDialog = () => {
            this._isDialogOpen.value = false;
        }

        this._loadData();

        return (
            <div className="flex-grow">
                <div>
                    <Table columns={this._configureGridColumns()}
                        itemProvider={this._tableRowData}
                        selection={this.selection} />
                    <Observer isDialogOpen={this._isDialogOpen}>
                        {(props: { isDialogOpen: boolean }) => {
                            return props.isDialogOpen ? (
                                <Dialog
                                    titleProps={{ text: this._dialogTitle.value }}
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
                                    You have modified this work item. You can save your changes, discard
                                    your changes, or cancel to continue editing.
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
        let approval: IReleaseApproval = tableItem;
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
                        iconProps={{ iconName: "CheckMark" }} />
                    <Button
                        key={"btn-reject-" + approval.id}
                        text="Reject"
                        danger={true}
                        iconProps={{ iconName: "Cancel" }} />
                </ButtonGroup>
            </SimpleTableCell>
        );
    }

    async _loadData(): Promise<void> {
        const approvals = await this._releaseService.listAll();
        this._tableRowData.removeAll();
        this._tableRowData.push(...approvals);
    }

    async approveAll(): Promise<void> {
        if (this.selection.value.length == 0) {
            await this._showErrorMessage("You need to select at least one release to Approve.");
            return;
        }
        this._dialogTitle.value = "Confirm Approve All";
        this._isDialogOpen.value = true;
    }

    async rejectAll(): Promise<void> {
        if (this.selection.value.length == 0) {
            await this._showErrorMessage("You need to select at least one release to Reject.");
            return;
        }
        this._dialogTitle.value = "Confirm Reject All";
        this._isDialogOpen.value = true;
    }

    async _showErrorMessage(message: string): Promise<void> {
        const globalMessagesSvc = await SDK.getService<IGlobalMessagesService>(CommonServiceIds.GlobalMessagesService);
        globalMessagesSvc.addToast({
            duration: 3000,
            message: message
        });
    }
}