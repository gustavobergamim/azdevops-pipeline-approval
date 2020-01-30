import * as React from "react";
import { TwoLineTableCell, ITableColumn } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
// import { Link } from "azure-devops-ui/Link";
import { Icon } from "azure-devops-ui/Icon";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { Colors } from "@src-root/hub/model/Colors";
import { ReleaseApproval, ApprovalType } from "azure-devops-extension-api/Release";
import { PillGroup } from "azure-devops-ui/PillGroup";

export function renderGridReleaseInfoCell(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<{}>,
    tableItem: any
): JSX.Element {
    const approval: ReleaseApproval = tableItem;
    return (<GridReleaseInfoCell
        key={`col-release-${columnIndex}-${rowIndex}`}
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        releaseApproval={approval} />);
}

export interface IGridReleaseInfoCellProps {
    releaseApproval: ReleaseApproval;
    rowIndex: number;
    columnIndex: number;
    tableColumn: ITableColumn<{}>;
}

export default class GridReleaseInfoCell extends React.Component<IGridReleaseInfoCellProps> {

    constructor(props: IGridReleaseInfoCellProps) {
        super(props);
    }

    render(): JSX.Element {
        const releaseName = this.props.releaseApproval.release.name;
        const releaseUri = "#";//this.props.releaseApproval.release.url;
        const environmentName = this.props.releaseApproval.releaseEnvironment.name;
        const environmentUri = "#";//this.props.releaseApproval.releaseEnvironment.url;
        const approvalType = this.props.releaseApproval.approvalType;

        let approvalTypeLabel: string = '';
        switch (approvalType) {
            case ApprovalType.PreDeploy:
                approvalTypeLabel = 'Pre-Deployment';
                break;
            case ApprovalType.PostDeploy:
                approvalTypeLabel = 'Post-Deployment';
                break;
        }

        return (
            <TwoLineTableCell
                columnIndex={this.props.columnIndex}
                tableColumn={this.props.tableColumn}
                key={`col-release-${this.props.columnIndex}-${this.props.rowIndex}`}
                className="bolt-table-cell-content-with-inline-link no-v-padding"
                line1={
                    <span className="flex-row scroll-hidden">
                        <Tooltip text={releaseName} overflowOnly>
                            <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
                                {/* <Link
                                className="fontSizeM font-size-m text-ellipsis bolt-table-link bolt-table-inline-link"
                                excludeTabStop
                                href={releaseUri}> */}
                                <Icon iconName="ProductRelease" />
                                {releaseName}
                                {/* </Link> */}
                            </span>
                        </Tooltip>
                    </span>
                }
                line2={
                    <Tooltip text={environmentName} overflowOnly>
                        <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
                            <PillGroup className="flex-row">
                                <Pill
                                    size={PillSize.compact}
                                    variant={PillVariant.colored}
                                    color={Colors.darkRedColor}>
                                    <Icon iconName="ServerEnviroment" className="icon-margin" />
                                    {environmentName}
                                </Pill>
                                <Pill
                                    size={PillSize.compact}
                                    variant={PillVariant.outlined}>
                                    {approvalTypeLabel}
                                </Pill>
                            </PillGroup>
                        </span>
                    </Tooltip>
                } />
        );
    }
}