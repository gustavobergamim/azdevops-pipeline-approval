import * as React from "react";
import { IReleaseApproval } from "@src-root/hub/model/IReleaseApproval";
import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import { Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { Link } from "azure-devops-ui/Link";

export function renderGridPipelineCell(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<{}>,
    tableItem: any
): JSX.Element {
    const approval: IReleaseApproval = tableItem;
    return (<ReleaseApprovalGridPipelineCell
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        releaseApproval={approval} />);
}

export interface IReleaseApprovalGridPipelineCellProps {
    releaseApproval: IReleaseApproval;
    rowIndex: number;
    columnIndex: number;
    tableColumn: ITableColumn<{}>;
}

export default class ReleaseApprovalGridPipelineCell extends React.Component<IReleaseApprovalGridPipelineCellProps> {

    constructor(props: IReleaseApprovalGridPipelineCellProps) {
        super(props);
    }

    render(): JSX.Element {
        const releaseDefinitionName = this.props.releaseApproval.releaseDefinition.name;
        const releaseDefinitionUri = "#";//this.props.releaseApproval.releaseDefinition.url;
        return (
            <SimpleTableCell
                columnIndex={this.props.columnIndex}
                tableColumn={this.props.tableColumn}
                key={"col-" + this.props.columnIndex}
                contentClassName="fontWeightSemiBold font-weight-semibold fontSizeM font-size-m scroll-hidden">
                <Tooltip overflowOnly={true}>
                    <Link
                        className="fontSizeM font-size-m text-ellipsis bolt-table-link bolt-table-inline-link"
                        excludeTabStop
                        href={releaseDefinitionUri}>
                        <Status
                            {...Statuses.Waiting}
                            key="waiting"
                            className="icon-large-margin"
                            size={StatusSize.m} />
                        {releaseDefinitionName}
                    </Link>
                </Tooltip>
            </SimpleTableCell>
        );
    }

}