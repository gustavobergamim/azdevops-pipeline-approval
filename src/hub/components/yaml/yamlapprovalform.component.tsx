import * as React from "react";
import { Panel } from "azure-devops-ui/Panel";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Observer } from "azure-devops-ui/Observer";
import { Card } from "azure-devops-ui/Card";
import { FormItem } from "azure-devops-ui/FormItem";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { ScrollableList, IListItemDetails, ListItem } from "azure-devops-ui/List";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { Icon, IconSize } from "azure-devops-ui/Icon";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { PillGroup, PillGroupOverflow } from "azure-devops-ui/PillGroup";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { Colors } from "@src-root/hub/model/Colors";
import { ReleaseApprovalAction } from "@src-root/hub/model/ReleaseApprovalAction";
import { YamlApprovalItem } from "@src-root/hub/model/YamlApproval";

export type YamlApprovalExecutor = (action: ReleaseApprovalAction, items: YamlApprovalItem[], comment: string) => Promise<void>;

export interface IYamlApprovalFormProps {
    onExecute: YamlApprovalExecutor;
}

interface IFormState {
    isOpen: boolean;
    busy: boolean;
}

/** Confirmation panel for YAML stage approvals: lists the selected runs, takes a comment and runs the action once. */
export default class YamlApprovalForm extends React.Component<IYamlApprovalFormProps> {

    private _state = new ObservableValue<IFormState>({ isOpen: false, busy: false });
    private _comment = new ObservableValue<string | undefined>("");
    private _action: ReleaseApprovalAction = ReleaseApprovalAction.Approve;
    private _items: YamlApprovalItem[] = [];

    render(): JSX.Element {
        return (
            <Observer state={this._state}>
                {(props: { state: IFormState }) => {
                    if (!props.state.isOpen) return null;
                    const supersededCount = this._items.filter(item => item.newerRunName).length;
                    return (
                        <Panel
                            lightDismiss={false}
                            titleProps={{ text: `YAML stage ${this._action.title} confirmation` }}
                            description={`Confirm that you want to ${this._action.action} the following ${this._items.length} stage approval(s):`}
                            footerButtonProps={[
                                {
                                    text: "Cancel",
                                    onClick: this.closeDialog,
                                    disabled: props.state.busy
                                },
                                {
                                    text: props.state.busy ? "Working..." : "Confirm",
                                    onClick: this.confirmAction,
                                    primary: true,
                                    disabled: props.state.busy
                                }
                            ]}
                            onDismiss={this.closeDialog}>
                            <div>
                                {supersededCount > 0
                                    ? <MessageCard className="flex-self-stretch" severity={MessageCardSeverity.Warning}>
                                        {`${supersededCount} of the selected run(s) have a newer run of the same pipeline and branch waiting at the same stage.`}
                                    </MessageCard>
                                    : null}
                                <Card>
                                    <div className="flex-column" style={{ width: "100%" }}>
                                        <div style={{ display: "flex", maxHeight: "240px" }}>
                                            <ScrollableList
                                                itemProvider={new ArrayItemProvider<YamlApprovalItem>(this._items)}
                                                renderRow={this.renderRow}
                                                width="100%" />
                                        </div>
                                        <FormItem label="Comment:">
                                            <TextField
                                                value={this._comment}
                                                onChange={(e, newValue) => (this._comment.value = newValue)}
                                                multiline
                                                rows={4}
                                                width={TextFieldWidth.auto} />
                                        </FormItem>
                                    </div>
                                </Card>
                            </div>
                        </Panel>
                    );
                }}
            </Observer>
        );
    }

    openDialog(action: ReleaseApprovalAction, items: YamlApprovalItem[]): void {
        if (items.length === 0) return;
        this._action = action;
        this._items = items;
        this._comment.value = "";
        this._state.value = { isOpen: true, busy: false };
    }

    closeDialog = () => {
        if (this._state.value.busy) return;
        this._state.value = { isOpen: false, busy: false };
    }

    private confirmAction = async () => {
        if (this._state.value.busy) return;
        this._state.value = { isOpen: true, busy: true };
        try {
            await this.props.onExecute(this._action, this._items, this._comment.value || "");
        } finally {
            this._state.value = { isOpen: false, busy: false };
        }
    }

    private renderRow = (index: number, item: YamlApprovalItem, details: IListItemDetails<YamlApprovalItem>, key?: string): JSX.Element => {
        return (
            <ListItem key={key || "yaml-list-item" + index} index={index} details={details}>
                <div className="flex-row h-scroll-hidden">
                    <Icon iconName="Build" size={IconSize.medium} />
                    <div style={{ marginLeft: "10px", padding: "10px 0px" }} className="flex-column h-scroll-hidden">
                        <span className="text-ellipsis">{item.pipelineName}</span>
                        <span className="fontSizeMS font-size-ms text-ellipsis secondary-text" style={{ marginTop: "5px" }}>
                            <PillGroup className="flex-row yaml-pills" overflow={PillGroupOverflow.wrap}>
                                <Pill size={PillSize.compact} variant={PillVariant.outlined}>#{item.runName}</Pill>
                                <Pill size={PillSize.compact} variant={PillVariant.colored} color={Colors.darkRedColor}>
                                    {item.stageName || "Stage"}
                                </Pill>
                                {item.branch ? <Pill size={PillSize.compact} variant={PillVariant.outlined}>{item.branch}</Pill> : null}
                                {item.newerRunName
                                    ? <Pill size={PillSize.compact} variant={PillVariant.outlined} iconProps={{ iconName: "Warning" }}>
                                        Newer run waiting: #{item.newerRunName}
                                    </Pill>
                                    : null}
                            </PillGroup>
                        </span>
                    </div>
                </div>
            </ListItem>
        );
    };
}
