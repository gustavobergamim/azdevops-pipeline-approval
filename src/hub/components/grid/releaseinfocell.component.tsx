import * as React from "react";
import { TwoLineTableCell, ITableColumn } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { Icon } from "azure-devops-ui/Icon";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { Colors } from "@src-root/hub/model/Colors";
import { ReleaseApproval, ApprovalType } from "azure-devops-extension-api/Release";
import { PillGroup } from "azure-devops-ui/PillGroup";
import { Link } from "azure-devops-ui/Link";

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
        const release = this.props.releaseApproval.release;
        const releaseName = release.name;
        const releaseLink = release._links && release._links.web ? release._links.web.href : '';

        const releaseEnvironment = this.props.releaseApproval.releaseEnvironment;
        const releaseEnvironmentName = releaseEnvironment.name;
        const releaseEnvironmentLink = releaseEnvironment._links && releaseEnvironment._links.web ? releaseEnvironment._links.web.href : '';

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
                                <Link href={releaseLink} target="_blank">
                                    <Icon iconName="ProductRelease" />
                                    {releaseName}
                                </Link>
                            </span>
                        </Tooltip>
                    </span>
                }
                line2={
                    <Tooltip text={releaseEnvironmentName} overflowOnly>
                        <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
                            <PillGroup className="flex-row">
                                <Pill
                                    size={PillSize.compact}
                                    variant={PillVariant.colored}
                                    color={Colors.darkRedColor}
                                    onClick={() => {
                                        if (releaseEnvironmentLink) {
                                            window.open(releaseEnvironmentLink, "_blank");
                                        }
                                    }}>
                                    <Icon iconName="ServerEnviroment" className="icon-margin" />
                                    {releaseEnvironmentName}
                                </Pill>
                                <Pill
                                    size={PillSize.compact}
                                    variant={PillVariant.outlined}>
                                    {approvalTypeLabel}
                                </Pill>
                            </PillGroup>
                        </span>
                    </ Tooltip>
                } />
        );
    }
}