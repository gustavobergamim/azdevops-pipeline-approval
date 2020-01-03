import * as React from "react";
import { IReleaseApproval } from "@src-root/hub/model/IReleaseApproval";
import { TwoLineTableCell, ITableColumn } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { Link } from "azure-devops-ui/Link";
import { Icon } from "azure-devops-ui/Icon";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { Colors } from "@src-root/hub/model/Colors";

export function renderGridReleaseInfoCell(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<{}>,
    tableItem: any
): JSX.Element {
    const approval: IReleaseApproval = tableItem;
    return (<ReleaseApprovalGridReleaseInfoCell
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        releaseApproval={approval} />);
}

export interface IReleaseApprovalGridReleaseInfoCellProps {
    releaseApproval: IReleaseApproval;
    rowIndex: number;
    columnIndex: number;
    tableColumn: ITableColumn<{}>;
}

export default class ReleaseApprovalGridReleaseInfoCell extends React.Component<IReleaseApprovalGridReleaseInfoCellProps> {

    constructor(props: IReleaseApprovalGridReleaseInfoCellProps) {
        super(props);
    }

    render(): JSX.Element {
        const releaseName = this.props.releaseApproval.release.name;
        const releaseUri = "#";//this.props.releaseApproval.release.url;
        const environmentName = this.props.releaseApproval.releaseEnvironment.name;
        const environmentUri = "#";//this.props.releaseApproval.releaseEnvironment.url;
        return (
            <TwoLineTableCell
                columnIndex={this.props.columnIndex}
                tableColumn={this.props.tableColumn}
                key={"col-" + this.props.columnIndex}
                className="bolt-table-cell-content-with-inline-link no-v-padding"
                line1={
                    <span className="flex-row scroll-hidden">
                        <Tooltip text={releaseName} overflowOnly>
                            <Link
                                className="fontSizeM font-size-m text-ellipsis bolt-table-link bolt-table-inline-link"
                                excludeTabStop
                                href={releaseUri}>
                                <Icon iconName="ProductRelease" />
                                {releaseName}
                            </Link>
                        </Tooltip>
                    </span>
                }
                line2={
                    <Tooltip text={environmentName} overflowOnly>
                        <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
                            <Link
                                className="monospaced-text text-ellipsis flex-row flex-center bolt-table-link bolt-table-inline-link"
                                excludeTabStop
                                href={environmentUri}>
                                <Pill
                                    size={PillSize.compact}
                                    variant={PillVariant.colored}
                                    color={Colors.darkRedColor}>
                                    <Icon iconName="ServerEnviroment" className="icon-margin" />
                                    {environmentName}
                                </Pill>
                            </Link>
                        </span>
                    </Tooltip>
                } />
        );
    }
}