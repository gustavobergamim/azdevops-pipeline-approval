import * as React from "react";
import { IReleaseApproval } from "@src-root/hub/model/IReleaseApproval";
import { TwoLineTableCell, ITableColumn } from "azure-devops-ui/Table";
import { UserService } from "@src-root/hub/services/user.service";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { Link } from "azure-devops-ui/Link";
import { Icon } from "azure-devops-ui/Icon";
import { Duration } from "azure-devops-ui/Duration";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { Colors } from "@src-root/hub/model/Colors";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";

export function renderGridApproverInfoCell(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<{}>,
    tableItem: any
): JSX.Element {
    const approval: IReleaseApproval = tableItem;
    return (<ReleaseApprovalGridApproverInfoCell
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        releaseApproval={approval} />);
}

export interface IReleaseApprovalGridApproverInfoCellProps {
    releaseApproval: IReleaseApproval;
    rowIndex: number;
    columnIndex: number;
    tableColumn: ITableColumn<{}>;
}

export default class ReleaseApprovalGridApproverInfoCell extends React.Component<IReleaseApprovalGridApproverInfoCellProps> {

    private _userService: UserService = new UserService();

    constructor(props: IReleaseApprovalGridApproverInfoCellProps) {
        super(props);
    }

    render(): JSX.Element {
        const isLoggedUser = this._userService.isLoggedUser(this.props.releaseApproval.approver.id);
        const isGroup = this.props.releaseApproval.approver.isContainer;
        const iconName = isGroup ? "Group" : "Contact";
        const onBehalfText = `On behalf of ${this.props.releaseApproval.approver.displayName}`;
        return (
            <TwoLineTableCell
                columnIndex={this.props.columnIndex}
                tableColumn={this.props.tableColumn}
                key={"col-" + this.props.columnIndex}
                className="bolt-table-cell-content-with-inline-link no-v-padding"
                line1={
                    <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
                        <ConditionalChildren renderChildren={!isLoggedUser}>
                            <Icon iconName={iconName} className="icon-margin" />
                            <span className="flex-row scroll-hidden">
                                <Tooltip text={onBehalfText} overflowOnly>
                                    <span>{onBehalfText}</span>
                                </Tooltip>
                            </span>
                        </ConditionalChildren>
                    </span>
                }
                line2={
                    <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
                        <Icon iconName="Clock" className="icon-margin" />
                        Pending for&nbsp;
                        <Duration
                            startDate={this.props.releaseApproval.createdOn}
                            endDate={new Date()}
                        />
                    </span>
                } />
        );
    }
}