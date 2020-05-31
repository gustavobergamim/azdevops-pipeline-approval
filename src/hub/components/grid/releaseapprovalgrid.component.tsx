import "./grid.scss";

import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { Table, ITableColumn, ColumnSelect } from "azure-devops-ui/Table";
import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { ReleaseApprovalService } from "@src-root/hub/services/release-approval.service";
import { ListSelection } from "azure-devops-ui/List";
import { CommonServiceIds, IGlobalMessagesService } from "azure-devops-extension-api";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { ISelectionRange } from "azure-devops-ui/Utilities/Selection";
import { ReleaseApprovalAction } from "@src-root/hub/model/ReleaseApprovalAction";
import { ReleaseApprovalEvents, EventType } from "@src-root/hub/model/ReleaseApprovalEvents";
import { renderGridPipelineCell } from "@src-root/hub/components/grid/pipelinecell.component";
import { renderGridReleaseInfoCell } from "@src-root/hub/components/grid/releaseinfocell.component";
import { renderGridApproverInfoCell } from "@src-root/hub/components/grid/approverinfocell.component";
import { renderGridActionsCell } from "@src-root/hub/components/grid/actionscell.component";
import { Card } from "azure-devops-ui/Card";
import { ReleaseApproval } from "azure-devops-extension-api/Release";
import { Button } from "azure-devops-ui/Button";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import ReleaseApprovalForm from "@src-root/hub/components/form/form.component";
import { ReleaseService } from "@src-root/hub/services/release.service";

import { FilterBar } from "azure-devops-ui/FilterBar";
import { Filter, FILTER_CHANGE_EVENT, FilterOperatorType } from "azure-devops-ui/Utilities/Filter";
import { KeywordFilterBarItem } from "azure-devops-ui/TextFilterBarItem";
import { DropdownFilterBarItem } from "azure-devops-ui/Dropdown";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { DropdownSelection } from "azure-devops-ui/Utilities/DropdownSelection";

export default class ReleaseApprovalGrid extends React.Component {

    private _approvalsService: ReleaseApprovalService = new ReleaseApprovalService();
    private _releaseService: ReleaseService = new ReleaseService();
    private _tableRowData: ObservableArray<ReleaseApproval> = new ObservableArray<ReleaseApproval>([]);
    // private _pageLength: number = 20;
    // private _hasMoreItems: ObservableValue<boolean> = new ObservableValue<boolean>(false);
    private _selection: ListSelection = new ListSelection({ selectOnFocus: false, multiSelect: true });
    private _selectedReleases: ArrayItemProvider<ReleaseApproval> = new ArrayItemProvider<ReleaseApproval>([]);
    private _approvalForm: React.RefObject<ReleaseApprovalForm>;
    private get dialog() {
        return this._approvalForm.current as ReleaseApprovalForm;
    }
    private _action: ObservableValue<ReleaseApprovalAction> = new ObservableValue<ReleaseApprovalAction>(ReleaseApprovalAction.Reject);

    private _filter: Filter;
    private _selectionSingleList = new DropdownSelection();
    private _stagesFilter: ObservableArray<IListBoxItem<string>> = new ObservableArray<IListBoxItem<string>>([]);

    private _configureGridColumns(): ITableColumn<{}>[] {
        return [
            new ColumnSelect() as ITableColumn<{}>,
            {
                id: "pipeline",
                name: "Release",
                renderCell: renderGridPipelineCell,
                width: 250
            },
            {
                id: "releaseInfo",
                renderCell: renderGridReleaseInfoCell,
                width: -40
            },
            {
                id: "approverInfo",
                name: "Approval Status",
                renderCell: renderGridApproverInfoCell,
                width: -60
            },
            {
                id: "actions",
                renderCell: renderGridActionsCell,
                width: 150
            }
        ]
    }

    constructor(props: {}) {
        super(props);
        this._approvalForm = React.createRef();
        this._filter = new Filter();
        this.subscribeEvents();
    }

    private subscribeEvents(): void {
        ReleaseApprovalEvents.subscribe(EventType.RefreshGrid, async () => {
            await this.refreshGrid();
        });
        ReleaseApprovalEvents.subscribe(EventType.ClearGridSelection, () => {
            this._selectedReleases = new ArrayItemProvider<ReleaseApproval>([]);
        });
        ReleaseApprovalEvents.subscribe(EventType.ApproveAllReleases, async () => {
            await this.approveAll();
        });
        ReleaseApprovalEvents.subscribe(EventType.ApproveSingleRelease, (approval: ReleaseApproval) => {
            this.approveSingle(approval);
        });
        ReleaseApprovalEvents.subscribe(EventType.RejectAllReleases, async () => {
            await this.rejectAll();
        });
        ReleaseApprovalEvents.subscribe(EventType.RejectSingleRelease, (approval: ReleaseApproval) => {
            this.rejectSingle(approval);
        });

        this._selection.subscribe((selection: ISelectionRange[], action: string) => {
            ReleaseApprovalEvents.fire(EventType.GridRowSelectionChanged, selection, action, this._selection.selectedCount);
        });
    }

    render(): JSX.Element {
        this.loadData();
        return (
            <div className="flex-grow">
                <div>
                    <FilterBar className="filter-bar" filter={this._filter}>
                        <DropdownFilterBarItem
                            filterItemKey="stage"
                            filter={this._filter}
                            items={this._stagesFilter}
                            selection={this._selectionSingleList}
                            placeholder="Stage"
                        />
                    </FilterBar>
                    <Card className="flex-grow bolt-table-card" contentProps={{ contentPadding: false }}>
                        <Table columns={this._configureGridColumns()}
                            itemProvider={this._tableRowData}
                            selection={this._selection} />
                    </Card>
                    {/* <ConditionalChildren renderChildren={this._hasMoreItems}>
                        <div style={{ marginTop: "10px" }}>
                            <Button
                                onClick={this.loadData}
                                text="Load more..." />
                        </div>
                    </ConditionalChildren> */}
                    <ReleaseApprovalForm
                        ref={this._approvalForm}
                        action={this._action} />
                </div>
            </div >
        );
    }

    private loadData = async () => {
        // let continuationToken = 0;
        // const lastIndex = this._tableRowData.value.length - 1;
        // if (lastIndex >= 0) {
        //     const lastItem = this._tableRowData.value[lastIndex];
        //     continuationToken = lastItem.id - 1;
        // }
        const rowShimmer = this.getRowShimmer(1);
        this._tableRowData.push(...rowShimmer);
        const approvals = await this._approvalsService.findAllApprovals();
        await this._releaseService.fillLinks(approvals);
        // this._hasMoreItems.value = false; // this._pageLength == approvals.length;
        this._tableRowData.pop();
        this._tableRowData.push(...approvals.filter(a => this._tableRowData.value.every(x => x.id !== a.id)));
        this.updateFilters();
    }

    private updateFilters() {
        let stages = this._tableRowData.value.map(a => a.releaseEnvironment.name);
        stages = stages.filter((stage, index) => stages.indexOf(stage) === index);
        this._stagesFilter.removeAll();
        this._stagesFilter.push(...stages.map(stage => {
            return {
                id: stage,
                text: stage,
                iconProps: { iconName: "ServerEnviroment" }
            };
        }));
    }

    private getRowShimmer(length: number): any[] {
        return new Array(length).fill(new ObservableValue<ReleaseApproval | undefined>(undefined))
    }

    async refreshGrid(): Promise<void> {
        this._tableRowData.removeAll();
        await this.loadData();
    }

    private approveSingle(approval: ReleaseApproval): void {
        this._selectedReleases = new ArrayItemProvider<ReleaseApproval>([approval]);
        this.approve();
    }

    async approveAll(): Promise<void> {
        if (this._selection.value.length == 0) {
            await this.showErrorMessage("You need to select at least one release to Approve.");
            return;
        }
        this.getSelectedReleases();
        this.approve();
    }

    private approve(): void {
        this._action.value = ReleaseApprovalAction.Approve;
        this.dialog.openDialog(this._selectedReleases);
    }

    private rejectSingle(approval: ReleaseApproval): void {
        this._selectedReleases = new ArrayItemProvider<ReleaseApproval>([approval]);
        this.reject();
    }

    async rejectAll(): Promise<void> {
        if (this._selection.value.length == 0) {
            await this.showErrorMessage("You need to select at least one release to Reject.");
            return;
        }
        this.getSelectedReleases();
        this.reject();
    }

    private reject(): void {
        this._action.value = ReleaseApprovalAction.Reject;
        this.dialog.openDialog(this._selectedReleases);
    }

    private getSelectedReleases(): void {
        this._selectedReleases = new ArrayItemProvider<ReleaseApproval>([]);
        let releases: Array<ReleaseApproval> = new Array<ReleaseApproval>();
        this._selection.value.forEach((range: ISelectionRange, rangeIndex: number) => {
            for (let index: number = range.beginIndex; index <= range.endIndex; index++) {
                releases.push(this._tableRowData.value[index]);
            }
        });
        this._selectedReleases = new ArrayItemProvider<ReleaseApproval>(releases);
    }

    private async showErrorMessage(message: string): Promise<void> {
        const globalMessagesSvc = await SDK.getService<IGlobalMessagesService>(CommonServiceIds.GlobalMessagesService);
        globalMessagesSvc.addToast({
            duration: 3000,
            message: message
        });
    }
}