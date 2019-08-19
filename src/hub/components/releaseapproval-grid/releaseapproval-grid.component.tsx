import * as React from "react";
import { Table, renderSimpleCell, ITableColumn, SimpleTableCell, ColumnSelect } from "azure-devops-ui/Table";
import { ObservableArray } from "azure-devops-ui/Core/Observable";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { Button } from "azure-devops-ui/Button";
import { IReleaseApproval } from "../../model/IReleaseApproval";
import { ReleaseApprovalService } from "../../services/release-approval.service";

export default class ReleaseApprovalGrid extends React.Component {

    _releaseService: ReleaseApprovalService = new ReleaseApprovalService();
    private tableRowData: ObservableArray<IReleaseApproval> = new ObservableArray<IReleaseApproval>([]);

    private configureGridColumns(): ITableColumn<{}>[] {
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
        this.loadData();
        return (
            <div className="flex-grow">
                <div>
                    <Table columns={this.configureGridColumns()}
                        itemProvider={this.tableRowData} />
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

    private async loadData(): Promise<void> {
        const approvals = await this._releaseService.listAll();
        this.tableRowData.removeAll();
        this.tableRowData.push(...approvals);
    }
}