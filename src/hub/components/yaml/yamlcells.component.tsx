import * as React from "react";
import { ITableColumn, SimpleTableCell, TwoLineTableCell } from "azure-devops-ui/Table";
import { Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { Link } from "azure-devops-ui/Link";
import { Icon } from "azure-devops-ui/Icon";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { PillGroup, PillGroupOverflow } from "azure-devops-ui/PillGroup";
import { Duration } from "azure-devops-ui/Duration";
import { Button } from "azure-devops-ui/Button";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { Colors } from "@src-root/hub/model/Colors";
import { YamlApprovalItem } from "@src-root/hub/model/YamlApproval";
import { ReleaseApprovalEvents, EventType } from "@src-root/hub/model/ReleaseApprovalEvents";

export function renderYamlPipelineCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<{}>, tableItem: YamlApprovalItem): JSX.Element {
    return (
        <TwoLineTableCell
            key={`col-yaml-pipeline-${columnIndex}-${rowIndex}`}
            columnIndex={columnIndex}
            tableColumn={tableColumn}
            className="bolt-table-cell-content-with-inline-link no-v-padding"
            iconProps={{ render: (className?: string) => <Status {...Statuses.Waiting} className={className} size={StatusSize.m} /> }}
            line1={
                <Tooltip text={tableItem.pipelineName} overflowOnly>
                    <span className="fontWeightSemiBold font-weight-semibold text-ellipsis">{tableItem.pipelineName}</span>
                </Tooltip>
            }
            line2={
                <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
                    <Icon iconName="Build" className="icon-margin" />
                    {tableItem.runUrl
                        ? <Link href={tableItem.runUrl} target="_blank" subtle={true} className="bolt-table-inline-link bolt-table-link">#{tableItem.runName}</Link>
                        : <span>#{tableItem.runName}</span>}
                </span>
            } />
    );
}

export function renderYamlStageCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<{}>, tableItem: YamlApprovalItem): JSX.Element {
    return (
        <TwoLineTableCell
            key={`col-yaml-stage-${columnIndex}-${rowIndex}`}
            columnIndex={columnIndex}
            tableColumn={tableColumn}
            className="no-v-padding"
            line1={
                <PillGroup className="flex-row yaml-pills" overflow={PillGroupOverflow.wrap}>
                    <Pill size={PillSize.compact} variant={PillVariant.colored} color={Colors.darkRedColor}>
                        {tableItem.stageName || "Stage"}
                    </Pill>
                    {tableItem.newerRunName
                        ? <Pill size={PillSize.compact} variant={PillVariant.outlined} iconProps={{ iconName: "Warning" }}>
                            Newer run waiting: #{tableItem.newerRunName}
                        </Pill>
                        : null}
                </PillGroup>
            }
            line2={
                <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
                    <Icon iconName="BranchMerge" className="icon-margin" />
                    <Tooltip text={tableItem.branch} overflowOnly>
                        <span className="text-ellipsis">{tableItem.branch || "-"}</span>
                    </Tooltip>
                </span>
            } />
    );
}

export function renderYamlApproverCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<{}>, tableItem: YamlApprovalItem): JSX.Element {
    const approvers = tableItem.pendingApprovers.map(identity => identity.displayName).filter(name => name).join(", ");
    const requestedBy = tableItem.requestedFor ? `Requested for ${tableItem.requestedFor.displayName}` : "";
    const line1Text = approvers ? `Waiting on ${approvers}` : requestedBy;
    return (
        <TwoLineTableCell
            key={`col-yaml-approver-${columnIndex}-${rowIndex}`}
            columnIndex={columnIndex}
            tableColumn={tableColumn}
            className="no-v-padding"
            line1={
                <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
                    <Icon iconName="Group" className="icon-margin" />
                    <Tooltip text={[line1Text, tableItem.instructions].filter(t => t).join(" — ")} overflowOnly={!tableItem.instructions}>
                        <span className="text-ellipsis">{line1Text}</span>
                    </Tooltip>
                </span>
            }
            line2={
                <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
                    <Icon iconName="Clock" className="icon-margin" />
                    Pending for&nbsp;
                    {tableItem.createdOn ? <Duration startDate={tableItem.createdOn} endDate={new Date()} /> : "-"}
                </span>
            } />
    );
}

export function renderYamlActionsCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<{}>, tableItem: YamlApprovalItem): JSX.Element {
    return (
        <SimpleTableCell
            key={`col-yaml-actions-${columnIndex}-${rowIndex}`}
            columnIndex={columnIndex}
            tableColumn={tableColumn}>
            <ButtonGroup>
                <Button
                    key={"btn-yaml-approve-" + tableItem.id}
                    tooltipProps={{ text: "Approve" }}
                    primary={true}
                    iconProps={{ iconName: "CheckMark" }}
                    onClick={() => ReleaseApprovalEvents.fire(EventType.YamlApproveSingle, tableItem)} />
                <Button
                    key={"btn-yaml-reject-" + tableItem.id}
                    tooltipProps={{ text: "Reject" }}
                    danger={true}
                    iconProps={{ iconName: "Cancel" }}
                    onClick={() => ReleaseApprovalEvents.fire(EventType.YamlRejectSingle, tableItem)} />
            </ButtonGroup>
        </SimpleTableCell>
    );
}
