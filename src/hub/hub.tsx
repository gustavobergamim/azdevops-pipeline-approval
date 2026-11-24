import "azure-devops-ui/Core/override.css";
import "./hub.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import ReleaseApprovalGrid from "@src-root/hub/components/grid/releaseapprovalgrid.component";
import YamlApprovalGrid from "@src-root/hub/components/yaml/yamlapprovalgrid.component";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { ReleaseApprovalEvents, EventType } from "@src-root/hub/model/ReleaseApprovalEvents";
import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { ISelectionRange } from "azure-devops-ui/Utilities/Selection";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { Observer } from "azure-devops-ui/Observer";
import { Tab, TabBar, TabSize } from "azure-devops-ui/Tabs";
import { Colors } from "./model/Colors";
import { LocalStorageService } from "./services/local-storage.service";

const TAB_CLASSIC = "classic";
const TAB_YAML = "yaml";

/** Renders its children once and never re-renders them, so tab switches don't reload the grids. */
class StaticContent extends React.Component<{ children?: React.ReactNode }> {
  shouldComponentUpdate(): boolean {
    return false;
  }

  render(): JSX.Element {
    return <React.Fragment>{this.props.children}</React.Fragment>;
  }
}

class Hub extends React.Component<{}> {

  private _filtersMessageKey: string = "filters-message";
  private _filtersToogleKey: string = "filters";
  private _selectedTabKey: string = "selected-tab";
  private _filtersToogle = false;
  private _showMessage: ObservableValue<boolean | undefined> = new ObservableValue<boolean | undefined>(false);
  private _storageService: LocalStorageService = new LocalStorageService();
  private _selectedTab: ObservableValue<string> = new ObservableValue<string>(TAB_CLASSIC);
  private _classicSelectedCount = 0;
  private _yamlSelectedCount = 0;

  _headerToolbar: React.RefObject<Header>;
  _releaseGrid: React.RefObject<ReleaseApprovalGrid>;
  _yamlGrid: React.RefObject<YamlApprovalGrid>;
  _commandBarItems: ObservableArray<IHeaderCommandBarItem> = new ObservableArray<IHeaderCommandBarItem>([]);

  constructor(props: {}) {
    super(props);
    this._headerToolbar = React.createRef();
    this._releaseGrid = React.createRef();
    this._yamlGrid = React.createRef();
    this.readQueryString();
    this.readSelectedTab();
    this.updateCommandBar();
    this.toogleMessage();
    this.subscribeEvents();
    SDK.init();
  }

  componentDidMount(): void {
    if (this._selectedTab.value === TAB_YAML) {
      SDK.ready().then(() => this.activateYamlTab());
    }
  }

  render(): JSX.Element {
    return (
      <Page className="flex-grow">
        <ConditionalChildren renderChildren={this._showMessage}>
          <MessageCard
            className="flex-self-stretch"
            onDismiss={this.onDismissMessage}
            severity={MessageCardSeverity.Info}>
            <Pill
              iconProps={{ iconName: "Lightbulb" }}
              color={Colors.darkRedColor}
              size={PillSize.large}
              variant={PillVariant.colored}
              className="mr-5">
              Try now!
            </Pill>
            Activate now the "Approvals with filters" preview feature and experiment filters for approvals.
          </MessageCard>
        </ConditionalChildren>
        <Header
          ref={this._headerToolbar}
          title={"Pending Approvals"}
          titleSize={TitleSize.Medium}
          titleIconProps={{ iconName: "Rocket" }}
          commandBarItems={this._commandBarItems} />
        <TabBar
          selectedTabId={this._selectedTab}
          onSelectedTabChanged={this.onSelectedTabChanged}
          tabSize={TabSize.Tall}>
          <Tab id={TAB_CLASSIC} name="Classic releases" iconProps={{ iconName: "Rocket" }} />
          <Tab id={TAB_YAML} name="YAML pipelines" iconProps={{ iconName: "Build" }} />
        </TabBar>
        <Observer selectedTab={this._selectedTab}>
          {(props: { selectedTab: string }) => (
            <div className="page-content page-content-top">
              <div style={props.selectedTab === TAB_CLASSIC ? undefined : { display: "none" }}>
                <StaticContent>
                  <ReleaseApprovalGrid ref={this._releaseGrid} filtersEnabled={this._filtersToogle} />
                </StaticContent>
              </div>
              <div style={props.selectedTab === TAB_YAML ? undefined : { display: "none" }}>
                <StaticContent>
                  <YamlApprovalGrid ref={this._yamlGrid} />
                </StaticContent>
              </div>
            </div>
          )}
        </Observer>
      </Page>
    );
  }

  private readQueryString() {
    const queryString = new URLSearchParams(window.location.search);
    this._filtersToogle = queryString.has(this._filtersToogleKey) && JSON.parse(queryString.get(this._filtersToogleKey) || "false");
  }

  private readSelectedTab() {
    const storedTab = this._storageService.getValue(this._selectedTabKey);
    this._selectedTab.value = storedTab === TAB_YAML ? TAB_YAML : TAB_CLASSIC;
  }

  private toogleMessage() {
    const storageValue = this._storageService.getValue(this._filtersMessageKey);
    const messageRead = storageValue?.toLowerCase() === 'true';
    this._showMessage.value = !messageRead && !this._filtersToogle;
  }

  private onDismissMessage = () => {
    this._storageService.setValue(this._filtersMessageKey, true.toString());
    this.toogleMessage();
  };

  private onSelectedTabChanged = (newTabId: string) => {
    this._selectedTab.value = newTabId;
    this._storageService.setValue(this._selectedTabKey, newTabId);
    this.updateCommandBar();
    if (newTabId === TAB_YAML) {
      this.activateYamlTab();
    }
  };

  private activateYamlTab() {
    if (this._yamlGrid.current) {
      this._yamlGrid.current.activate();
    }
  }

  private get isYamlTab(): boolean {
    return this._selectedTab.value === TAB_YAML;
  }

  /** Shows Approve/Reject Selected only when the active tab has a selection. */
  private updateCommandBar() {
    const selectedCount = this.isYamlTab ? this._yamlSelectedCount : this._classicSelectedCount;
    this._commandBarItems.removeAll();
    if (selectedCount > 0) {
      this._commandBarItems.push(this._buttonApproveSelected, this._buttonRejectSelected);
    }
    this._commandBarItems.push(this._buttonRefresh);
  }

  private subscribeEvents(): void {
    ReleaseApprovalEvents.subscribe(EventType.GridRowSelectionChanged,
      async (selection: ISelectionRange[], action: string, selectedItemsCount: number) => {
        this._classicSelectedCount = selectedItemsCount;
        this.updateCommandBar();
      });
    ReleaseApprovalEvents.subscribe(EventType.YamlSelectionChanged, (selectedItemsCount: number) => {
      this._yamlSelectedCount = selectedItemsCount;
      this.updateCommandBar();
    });
  }

  private _buttonApproveSelected: IHeaderCommandBarItem = {
    id: "approve-selected",
    iconProps: {
      iconName: "CheckMark"
    },
    important: true,
    onActivate: () => ReleaseApprovalEvents.fire(this.isYamlTab ? EventType.YamlApproveSelected : EventType.ApproveAllReleases),
    text: "Approve Selected",
    isPrimary: true
  };

  private _buttonRejectSelected: IHeaderCommandBarItem = {
    id: "reject-selected",
    iconProps: {
      iconName: "Cancel"
    },
    important: true,
    className: "danger",
    onActivate: () => ReleaseApprovalEvents.fire(this.isYamlTab ? EventType.YamlRejectSelected : EventType.RejectAllReleases),
    text: "Reject Selected"
  };

  private _buttonRefresh: IHeaderCommandBarItem = {
    id: "refresh",
    iconProps: {
      iconName: "Refresh"
    },
    important: true,
    onActivate: () => ReleaseApprovalEvents.fire(this.isYamlTab ? EventType.YamlRefreshGrid : EventType.RefreshGrid),
    text: "Refresh"
  };
}

ReactDOM.render(<Hub />, document.getElementById("root"));
