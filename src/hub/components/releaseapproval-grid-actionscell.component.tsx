import * as React from "react";
import { IReleaseApproval } from "@src-root/hub/model/IReleaseApproval";
import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import { UserService } from "@src-root/hub/services/user.service";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { Button } from "azure-devops-ui/Button";
import { ReleaseApprovalEvents, EventType } from "../model/ReleaseApprovalEvents";

export function renderGridActionsCell(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<{}>,
    tableItem: any
): JSX.Element {
    const approval: IReleaseApproval = tableItem;
    return (<ReleaseApprovalGridActionsCell
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        releaseApproval={approval} />);
}

export interface IReleaseApprovalGridActionsCellProps {
    releaseApproval: IReleaseApproval;
    rowIndex: number;
    columnIndex: number;
    tableColumn: ITableColumn<{}>;
}

export default class ReleaseApprovalGridActionsCell extends React.Component<IReleaseApprovalGridActionsCellProps> {

    private _userService: UserService = new UserService();

    constructor(props: IReleaseApprovalGridActionsCellProps) {
        super(props);
    }

    render(): JSX.Element {
        return (
            <SimpleTableCell
                columnIndex={this.props.columnIndex}
                tableColumn={this.props.tableColumn}
                key={"col-" + this.props.columnIndex}>
                <ButtonGroup>
                    <Button
                        key={"btn-approve-" + this.props.releaseApproval.id}
                        tooltipProps={{ text: "Approve" }}
                        primary={true}
                        iconProps={{ iconName: "CheckMark" }}
                        onClick={() => ReleaseApprovalEvents.fire(EventType.ApproveSingleRelease, this.props.releaseApproval)} />
                    <Button
                        key={"btn-reject-" + this.props.releaseApproval.id}
                        tooltipProps={{ text: "Reject" }}
                        danger={true}
                        iconProps={{ iconName: "Cancel" }}
                        onClick={() => ReleaseApprovalEvents.fire(EventType.RejectSingleRelease, this.props.releaseApproval)} />
                </ButtonGroup>
            </SimpleTableCell>
        );
    }
}