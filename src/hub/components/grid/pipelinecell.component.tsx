import * as React from "react";
import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import { Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
// import { Link } from "azure-devops-ui/Link";
import { ReleaseApproval } from "azure-devops-extension-api/Release";

export function renderGridPipelineCell(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<{}>,
    tableItem: any
): JSX.Element {
    const approval: ReleaseApproval = tableItem;
    return (<GridPipelineCell
        key={`col-pipeline-${columnIndex}-${rowIndex}`}
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        releaseApproval={approval} />);
}

export interface IGridPipelineCellProps {
    releaseApproval: ReleaseApproval;
    rowIndex: number;
    columnIndex: number;
    tableColumn: ITableColumn<{}>;
}

export default class GridPipelineCell extends React.Component<IGridPipelineCellProps> {

    constructor(props: IGridPipelineCellProps) {
        super(props);
    }

    render(): JSX.Element {
        const releaseDefinitionName = this.props.releaseApproval.releaseDefinition.name;
        const releaseDefinitionUri = "#";//this.props.releaseApproval.releaseDefinition.url;
        return (
            <SimpleTableCell
                columnIndex={this.props.columnIndex}
                tableColumn={this.props.tableColumn}
                key={`col-pipeline-${this.props.columnIndex}-${this.props.rowIndex}`}
                contentClassName="fontWeightSemiBold font-weight-semibold fontSizeM font-size-m scroll-hidden">
                <Tooltip overflowOnly={true}>
                    {/* <Link
                        className="fontSizeM font-size-m text-ellipsis bolt-table-link bolt-table-inline-link"
                        excludeTabStop
                        href={releaseDefinitionUri}> */}
                    <span className="fontSizeM font-size-m text-ellipsis bolt-table-link bolt-table-inline-link">
                        <Status
                            {...Statuses.Waiting}
                            key="waiting"
                            className="icon-large-margin"
                            size={StatusSize.m} />
                        {releaseDefinitionName}
                        {/* </Link> */}
                    </span>
                </Tooltip>
            </SimpleTableCell>
        );
    }

}