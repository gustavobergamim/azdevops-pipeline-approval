import "azure-devops-ui/Core/override.css";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import ReleaseApprovalGrid from "@src-root/hub/components/grid/releaseapprovalgrid.component";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { ReleaseApprovalEvents, EventType } from "@src-root/hub/model/ReleaseApprovalEvents";
import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { ISelectionRange } from "azure-devops-ui/Utilities/Selection";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { Colors } from "./model/Colors";
import { LocalStorageService } from "./services/local-storage.service";

class Hub extends React.Component<{}> {

  private _filtersMessageKey: string = "filters-message";
  private _filtersToogleKey: string = "filters";
  private _filtersToogle = false;
  private _showMessage: ObservableValue<boolean | undefined> = new ObservableValue<boolean | undefined>(false);
  private _storageService: LocalStorageService = new LocalStorageService();

  _headerToolbar: React.RefObject<Header>;
  _releaseGrid: React.RefObject<ReleaseApprovalGrid>;
  _commandBarItems: ObservableArray<IHeaderCommandBarItem> = new ObservableArray<IHeaderCommandBarItem>([]);

  constructor(props: {}) {
    super(props);
    this._headerToolbar = React.createRef();
    this._releaseGrid = React.createRef();
    this.readQueryString();
    this.initCommandBar();
    this.toogleMessage();
    this.subscribeEvents();
    SDK.init();
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
          title={"Releases to Approve"}
          titleSize={TitleSize.Medium}
          titleIconProps={{ iconName: "Rocket" }}
          commandBarItems={this._commandBarItems} />
        <div className="page-content page-content-top">
          <ReleaseApprovalGrid ref={this._releaseGrid} filtersEnabled={this._filtersToogle} />
        </div>
      </Page>
    );
  }

  private readQueryString() {
    const queryString = new URLSearchParams(window.location.search);
    this._filtersToogle = queryString.has(this._filtersToogleKey) && JSON.parse(queryString.get(this._filtersToogleKey) || "false");
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

  private initCommandBar() {
    this._commandBarItems.push(this._buttonRefresh);
  }

  private subscribeEvents(): void {
    ReleaseApprovalEvents.subscribe(EventType.GridRowSelectionChanged,
      async (selection: ISelectionRange[], action: string, selectedItemsCount: number) => {
        const hasSelection = selectedItemsCount > 0;
        if (hasSelection) {
          this._commandBarItems.removeAll();
          this._commandBarItems.push(
            this._buttonApproveSelected,
            this._buttonRejectSelected,
            this._buttonRefresh
          );
        } else if (this._commandBarItems.length > 1) {
          this._commandBarItems.splice(0, 2);
        }
      });
  }

  private _buttonApproveSelected: IHeaderCommandBarItem = {
    id: "approve-selected",
    iconProps: {
      iconName: "CheckMark"
    },
    important: true,
    onActivate: () => ReleaseApprovalEvents.fire(EventType.ApproveAllReleases),
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
    onActivate: () => ReleaseApprovalEvents.fire(EventType.RejectAllReleases),
    text: "Reject Selected"
  };

  private _buttonRefresh: IHeaderCommandBarItem = {
    id: "refresh",
    iconProps: {
      iconName: "Refresh"
    },
    important: true,
    onActivate: () => ReleaseApprovalEvents.fire(EventType.RefreshGrid),
    text: "Refresh"
  };
}

ReactDOM.render(<Hub />, document.getElementById("root"));
