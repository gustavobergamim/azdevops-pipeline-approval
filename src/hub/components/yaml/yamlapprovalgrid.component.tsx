import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IGlobalMessagesService } from "azure-devops-extension-api";
import { Table, ColumnSelect, ITableColumn } from "azure-devops-ui/Table";
import { Card } from "azure-devops-ui/Card";
import { ListSelection } from "azure-devops-ui/List";
import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { Observer } from "azure-devops-ui/Observer";
import { ISelectionRange } from "azure-devops-ui/Utilities/Selection";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { FilterBar } from "azure-devops-ui/FilterBar";
import { Filter, FILTER_CHANGE_EVENT } from "azure-devops-ui/Utilities/Filter";
import { DropdownFilterBarItem } from "azure-devops-ui/Dropdown";
import { DropdownMultiSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { ReleaseApprovalAction, ActionType } from "@src-root/hub/model/ReleaseApprovalAction";
import { ReleaseApprovalEvents, EventType } from "@src-root/hub/model/ReleaseApprovalEvents";
import { YamlApprovalItem, YamlApprovalActionResult } from "@src-root/hub/model/YamlApproval";
import { YamlApprovalService, YAML_APPROVALS_TOP } from "@src-root/hub/services/yaml-approval.service";
import { errorMessage } from "@src-root/hub/services/async";
import YamlApprovalForm from "@src-root/hub/components/yaml/yamlapprovalform.component";
import {
    renderYamlPipelineCell,
    renderYamlStageCell,
    renderYamlApproverCell,
    renderYamlActionsCell
} from "@src-root/hub/components/yaml/yamlcells.component";

interface IGridMessage {
    severity: MessageCardSeverity;
    text: string;
}

type TableRow = YamlApprovalItem | ObservableValue<YamlApprovalItem | undefined>;

/**
 * Pending approvals of YAML pipeline stages (environments and other resources with an Approvals check)
 * that the signed-in user can act on, in the current project. Data loads on the first activate() call.
 */
export default class YamlApprovalGrid extends React.Component<{}> {

    private _service = new YamlApprovalService();
    private _items: YamlApprovalItem[] = [];
    private _rows = new ObservableArray<TableRow>([]);
    private _selection = new ListSelection({ selectOnFocus: false, multiSelect: true });
    private _loaded = false;
    private _loading = false;
    private _messages = new ObservableArray<IGridMessage>([]);
    private _hasData = new ObservableValue<boolean>(false);
    private _isEmpty = new ObservableValue<boolean>(false);
    private _form = React.createRef<YamlApprovalForm>();

    private _filter = new Filter();
    private readonly FilterPipeline = "yaml-pipeline";
    private readonly FilterStage = "yaml-stage";
    private readonly FilterBranch = "yaml-branch";
    private _pipelineItems = new ObservableArray<IListBoxItem<string>>([]);
    private _pipelineSelection = new DropdownMultiSelection();
    private _stageItems = new ObservableArray<IListBoxItem<string>>([]);
    private _stageSelection = new DropdownMultiSelection();
    private _branchItems = new ObservableArray<IListBoxItem<string>>([]);
    private _branchSelection = new DropdownMultiSelection();

    private _columns: ITableColumn<any>[] = [
        new ColumnSelect(),
        { id: "pipeline", name: "Pipeline run", renderCell: renderYamlPipelineCell as any, width: -35 },
        { id: "stage", name: "Stage / Branch", renderCell: renderYamlStageCell as any, width: -30 },
        { id: "approvers", name: "Approval Status", renderCell: renderYamlApproverCell as any, width: -35 },
        { id: "actions", renderCell: renderYamlActionsCell as any, width: 150 }
    ];

    constructor(props: {}) {
        super(props);
        this._filter.subscribe(this.applyFilters, FILTER_CHANGE_EVENT);
        this._selection.subscribe((selection: ISelectionRange[]) => {
            ReleaseApprovalEvents.fire(EventType.YamlSelectionChanged, this._selection.selectedCount);
        });
    }

    componentDidMount(): void {
        ReleaseApprovalEvents.subscribe(EventType.YamlRefreshGrid, this.refresh);
        ReleaseApprovalEvents.subscribe(EventType.YamlApproveSelected, this.approveSelected);
        ReleaseApprovalEvents.subscribe(EventType.YamlRejectSelected, this.rejectSelected);
        ReleaseApprovalEvents.subscribe(EventType.YamlApproveSingle, this.approveSingle);
        ReleaseApprovalEvents.subscribe(EventType.YamlRejectSingle, this.rejectSingle);
    }

    componentWillUnmount(): void {
        ReleaseApprovalEvents.unsubscribe(EventType.YamlRefreshGrid, this.refresh);
        ReleaseApprovalEvents.unsubscribe(EventType.YamlApproveSelected, this.approveSelected);
        ReleaseApprovalEvents.unsubscribe(EventType.YamlRejectSelected, this.rejectSelected);
        ReleaseApprovalEvents.unsubscribe(EventType.YamlApproveSingle, this.approveSingle);
        ReleaseApprovalEvents.unsubscribe(EventType.YamlRejectSingle, this.rejectSingle);
    }

    render(): JSX.Element {
        return (
            <div className="flex-grow">
                <Observer messages={this._messages}>
                    {(props: { messages: IGridMessage[] }) => (
                        <div>
                            {props.messages.map((message, index) => (
                                <MessageCard
                                    key={"yaml-message-" + index}
                                    className="flex-self-stretch yaml-message"
                                    severity={message.severity}
                                    onDismiss={() => this._messages.splice(index, 1)}>
                                    {message.text}
                                </MessageCard>
                            ))}
                        </div>
                    )}
                </Observer>
                <Observer hasData={this._hasData}>
                    {(props: { hasData: boolean }) => props.hasData ? (
                        <FilterBar className="filter-bar" filter={this._filter}>
                            <DropdownFilterBarItem
                                filterItemKey={this.FilterPipeline}
                                filter={this._filter}
                                items={this._pipelineItems}
                                selection={this._pipelineSelection}
                                placeholder="Pipeline" />
                            <DropdownFilterBarItem
                                filterItemKey={this.FilterStage}
                                filter={this._filter}
                                items={this._stageItems}
                                selection={this._stageSelection}
                                placeholder="Stage" />
                            <DropdownFilterBarItem
                                filterItemKey={this.FilterBranch}
                                filter={this._filter}
                                items={this._branchItems}
                                selection={this._branchSelection}
                                placeholder="Branch" />
                        </FilterBar>
                    ) : null}
                </Observer>
                <Card className="flex-grow bolt-table-card" contentProps={{ contentPadding: false }}>
                    <Observer isEmpty={this._isEmpty}>
                        {(props: { isEmpty: boolean }) => props.isEmpty ? (
                            <div className="yaml-empty secondary-text">
                                There are no YAML stage approvals waiting for you in this project.
                            </div>
                        ) : (
                            <Table<any>
                                columns={this._columns}
                                itemProvider={this._rows}
                                selection={this._selection} />
                        )}
                    </Observer>
                </Card>
                <YamlApprovalForm ref={this._form} onExecute={this.execute} />
            </div>
        );
    }

    /** Called by the hub when the YAML tab is shown; loads data the first time only. */
    async activate(): Promise<void> {
        if (!this._loaded) {
            await this.refresh();
        }
    }

    refresh = async (): Promise<void> => {
        if (this._loading) return;
        this._loading = true;
        this._loaded = true;
        this._messages.removeAll();
        this._selection.clear();
        this._isEmpty.value = false;
        this._rows.removeAll();
        this._rows.push(new ObservableValue<YamlApprovalItem | undefined>(undefined));
        try {
            const result = await this._service.findPendingApprovals();
            this._items = result.items;
            if (result.truncated) {
                this.addMessage(MessageCardSeverity.Warning,
                    `The project has ${YAML_APPROVALS_TOP} or more pending approvals; only the first ${YAML_APPROVALS_TOP} were checked.`);
            }
        } catch (error) {
            this._items = [];
            this.addMessage(MessageCardSeverity.Error, `Could not load YAML stage approvals: ${errorMessage(error)}`);
        } finally {
            this._loading = false;
        }
        this.updateFilterOptions();
        this.applyFilters();
        this._hasData.value = this._items.length > 0;
    }

    private approveSelected = () => this.openForm(ReleaseApprovalAction.Approve, this.getSelectedItems());
    private rejectSelected = () => this.openForm(ReleaseApprovalAction.Reject, this.getSelectedItems());
    private approveSingle = (item: YamlApprovalItem) => this.openForm(ReleaseApprovalAction.Approve, [item]);
    private rejectSingle = (item: YamlApprovalItem) => this.openForm(ReleaseApprovalAction.Reject, [item]);

    private async openForm(action: ReleaseApprovalAction, items: YamlApprovalItem[]): Promise<void> {
        if (items.length === 0) {
            await this.showToast(`Select at least one stage approval to ${action.action}.`);
            return;
        }
        if (this._form.current) {
            this._form.current.openDialog(action, items);
        }
    }

    private execute = async (action: ReleaseApprovalAction, items: YamlApprovalItem[], comment: string): Promise<void> => {
        const results: YamlApprovalActionResult[] = action.type === ActionType.Approve
            ? await this._service.approveAll(items, comment)
            : await this._service.rejectAll(items, comment);
        const failed = results.filter(result => result.error);
        const succeeded = results.length - failed.length;
        const verb = action.type === ActionType.Approve ? "approved" : "rejected";
        await this.showToast(failed.length === 0
            ? `${succeeded} stage approval(s) ${verb}.`
            : `${succeeded} stage approval(s) ${verb}, ${failed.length} failed.`);
        await this.refresh();
        // Added after the refresh, which clears the previous messages.
        failed.forEach(result => this.addMessage(MessageCardSeverity.Error,
            `${result.item.pipelineName} #${result.item.runName} (${result.item.stageName || "stage"}): ${result.error}`));
    }

    private getSelectedItems(): YamlApprovalItem[] {
        const items: YamlApprovalItem[] = [];
        this._selection.value.forEach((range: ISelectionRange) => {
            for (let index = range.beginIndex; index <= range.endIndex; index++) {
                const row = this._rows.value[index];
                if (row && !(row instanceof ObservableValue)) items.push(row);
            }
        });
        return items;
    }

    private updateFilterOptions(): void {
        const distinct = (values: string[]) => values.filter((value, index) => value && values.indexOf(value) === index).sort();
        const toItems = (values: string[], iconName: string): IListBoxItem<string>[] =>
            values.map(value => ({ id: value, text: value, iconProps: { iconName } }));
        this._pipelineItems.removeAll();
        this._pipelineItems.push(...toItems(distinct(this._items.map(item => item.pipelineName)), "Build"));
        this._stageItems.removeAll();
        this._stageItems.push(...toItems(distinct(this._items.map(item => item.stageName)), "ServerEnviroment"));
        this._branchItems.removeAll();
        this._branchItems.push(...toItems(distinct(this._items.map(item => item.branch)), "BranchMerge"));
    }

    private applyFilters = (): void => {
        const state = this._filter.getState();
        const selected = (key: string): string[] => {
            const itemState = state[key];
            return itemState && Array.isArray(itemState.value) ? itemState.value.map(String) : [];
        };
        const pipelines = selected(this.FilterPipeline);
        const stages = selected(this.FilterStage);
        const branches = selected(this.FilterBranch);
        const visible = this._items.filter(item =>
            (pipelines.length === 0 || pipelines.indexOf(item.pipelineName) >= 0)
            && (stages.length === 0 || stages.indexOf(item.stageName) >= 0)
            && (branches.length === 0 || branches.indexOf(item.branch) >= 0));
        // Selection is index based: clear it so hidden rows are never actioned by mistake.
        this._selection.clear();
        this._rows.removeAll();
        this._rows.push(...visible);
        this._isEmpty.value = !this._loading && visible.length === 0;
    }

    private addMessage(severity: MessageCardSeverity, text: string): void {
        this._messages.push({ severity, text });
    }

    private async showToast(message: string): Promise<void> {
        const messagesService = await SDK.getService<IGlobalMessagesService>(CommonServiceIds.GlobalMessagesService);
        messagesService.addToast({ duration: 4000, message });
    }
}
