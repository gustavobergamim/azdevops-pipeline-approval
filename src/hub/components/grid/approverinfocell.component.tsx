import * as React from "react";
import { TwoLineTableCell, ITableColumn } from "azure-devops-ui/Table";
import { UserService } from "@src-root/hub/services/user.service";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { Icon } from "azure-devops-ui/Icon";
import { Duration } from "azure-devops-ui/Duration";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { ReleaseApproval } from "azure-devops-extension-api/Release";

export function renderGridApproverInfoCell(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<{}>,
    tableItem: any
): JSX.Element {
    const approval: ReleaseApproval = tableItem;
    return (<GridApproverInfoCell
        key={`col-approver-${columnIndex}-${rowIndex}`}
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        releaseApproval={approval} />);
}

export interface IGridApproverInfoCellProps {
    releaseApproval: ReleaseApproval;
    rowIndex: number;
    columnIndex: number;
    tableColumn: ITableColumn<{}>;
}

export default class GridApproverInfoCell extends React.Component<IGridApproverInfoCellProps> {

    private _userService: UserService = new UserService();

    constructor(props: IGridApproverInfoCellProps) {
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
                key={`col-approver-${this.props.columnIndex}-${this.props.rowIndex}`}
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