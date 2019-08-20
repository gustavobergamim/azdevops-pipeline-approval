import * as React from "react";
import { Table, renderSimpleCell, ITableColumn, SimpleTableCell, ColumnSelect } from "azure-devops-ui/Table";
import { ObservableArray } from "azure-devops-ui/Core/Observable";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { Button } from "azure-devops-ui/Button";
import { IReleaseApproval } from "../../model/IReleaseApproval";
import { ReleaseApprovalService } from "../../services/release-approval.service";
import { ListSelection } from "azure-devops-ui/List";

export interface IReleaseApprovalGridProps {
    onSelectionChange?: (selectedIndexes: number[]) => void;
}
export default class ReleaseApprovalGrid extends React.Component<IReleaseApprovalGridProps> {

    _releaseService: ReleaseApprovalService = new ReleaseApprovalService();
    _tableRowData: ObservableArray<IReleaseApproval> = new ObservableArray<IReleaseApproval>([]);
    selection: ListSelection = new ListSelection({ selectOnFocus: false, multiSelect: true });

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
                renderCell: this.renderStage,
                width: -30
            }
        ]
    };

    public render(): JSX.Element {
        this._loadData();
        return (
            <div className="flex-grow">
                <div>
                    <Table columns={this._configureGridColumns()}
                        itemProvider={this._tableRowData}
                        selection={this.selection} />
                </div>
            </div>
        );
    }

    private renderStage(
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
        alert("Approve All");
    }

    async rejectAll(): Promise<void> {
        alert("Reject All");
    }
}