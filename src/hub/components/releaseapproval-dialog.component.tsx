import * as React from "react";
import { Dialog } from "azure-devops-ui/Dialog";
import { ContentSize } from "azure-devops-ui/Callout";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { ReleaseApprovalAction, ActionType } from "@src-root/hub/model/ReleaseApprovalAction";
import { Observer } from "azure-devops-ui/Observer";
import { Card } from "azure-devops-ui/Card";
import { DialogReleaseList } from "@src-root/hub/components/dialog-releaselist.component";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { DialogDeferredDeployment } from "@src-root/hub/components/dialog-deferreddeployment.component";
import { ReleaseApprovalService } from "@src-root/hub/services/release-approval.service";
import { ReleaseApprovalEvents, EventType } from "@src-root/hub/model/ReleaseApprovalEvents";
import { ReleaseApproval } from "azure-devops-extension-api/Release";
import { FormItem } from "azure-devops-ui/FormItem";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";

export interface IDialogReleaseListProps {
    action: ObservableValue<ReleaseApprovalAction>;
}

export default class ReleaseApprovalDialog extends React.Component<IDialogReleaseListProps> {

    private _releaseService: ReleaseApprovalService = new ReleaseApprovalService();
    private _isOpen: ObservableValue<boolean> = new ObservableValue<boolean>(false);
    private _releases?: ArrayItemProvider<ReleaseApproval>;
    private _approvalComment = new ObservableValue<string>("");
    private _deferredDeployment: React.RefObject<DialogDeferredDeployment>;
    private get deferredDeployment() {
        return this._deferredDeployment.current as DialogDeferredDeployment;
    }

    constructor(props: IDialogReleaseListProps) {
        super(props);
        this._deferredDeployment = React.createRef();
    }

    render(): JSX.Element {
        return (
            <Observer isDialogOpen={this._isOpen}>
                {(props: { isDialogOpen: boolean }) => {
                    return props.isDialogOpen ? (
                        <Dialog
                            contentSize={ContentSize.Medium}
                            titleProps={{ text: `Release ${this.props.action.value.title} confirmation` }}
                            footerButtonProps={[
                                {
                                    text: "Cancel",
                                    onClick: this.closeDialog
                                },
                                {
                                    text: "Confirm",
                                    onClick: this.confirmAction,
                                    primary: true
                                }
                            ]}
                            onDismiss={this.closeDialog}>
                            <Card
                                titleProps={{ text: `Confirm that you want to ${this.props.action.value.action} the following releases:` }}>
                                <div className="ms-Grid" dir="ltr">
                                    <div className="ms-Grid-row" style={{ display: "flex", maxHeight: "200px" }}>
                                        <DialogReleaseList releases={this._releases} />
                                    </div>
                                    <div className="ms-Grid-row">
                                        <FormItem label="Comment:">
                                            <TextField
                                                value={this._approvalComment}
                                                onChange={(e, newValue) => (this._approvalComment.value = newValue)}
                                                multiline
                                                rows={4}
                                                width={TextFieldWidth.auto} />
                                        </FormItem>
                                    </div>
                                </div>
                            </Card>
                            <ConditionalChildren renderChildren={this.props.action.value.allowDefer}>
                                <DialogDeferredDeployment ref={this._deferredDeployment} />
                            </ConditionalChildren>
                        </Dialog>) : null;
                }}
            </Observer>
        );
    }

    openDialog(releases: ArrayItemProvider<ReleaseApproval>): void {
        this._approvalComment.value = "";
        this._releases = releases;
        this._isOpen.value = true;
    }

    closeDialog = () => {
        this._isOpen.value = false;
    }

    private confirmAction = async () => {
        if (!this._releases) return;
        let deferredDate: Date | null = null;
        if (this.props.action.value.allowDefer) {
            if (!this.deferredDeployment.validateDeferredDeploymentDate()) return;
            deferredDate = this.deferredDeployment.selectedDate;
        }
        if (this.props.action.value.type == ActionType.Approve) {
            await this._releaseService.approveAll(this._releases.value, this._approvalComment.value, deferredDate);
        } else {
            await this._releaseService.rejectAll(this._releases.value, this._approvalComment.value);
        }
        this.closeDialog();
        ReleaseApprovalEvents.fire(EventType.ClearGridSelection);
        setTimeout(() => ReleaseApprovalEvents.fire(EventType.RefreshGrid), 1000);
    }
}