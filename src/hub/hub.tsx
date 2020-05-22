import "azure-devops-ui/Core/override.css";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import ReleaseApprovalGrid from "@src-root/hub/components/grid/releaseapprovalgrid.component";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { ReleaseApprovalEvents, EventType } from "@src-root/hub/model/ReleaseApprovalEvents";
import { ObservableArray } from "azure-devops-ui/Core/Observable";
import { ISelectionRange } from "azure-devops-ui/Utilities/Selection";

class Hub extends React.Component<{}> {

  _headerToolbar: React.RefObject<Header>;
  _releaseGrid: React.RefObject<ReleaseApprovalGrid>;
  _commandBarItems: ObservableArray<IHeaderCommandBarItem> = new ObservableArray<IHeaderCommandBarItem>([]);

  constructor(props: {}) {
    super(props);
    this._headerToolbar = React.createRef();
    this._releaseGrid = React.createRef();
    this.initCommandBar();
    this.subscribeEvents();
    SDK.init();
  }

  render(): JSX.Element {
    return (
      <Page className="flex-grow">
        <Header
          ref={this._headerToolbar}
          title={"Releases to Approve"}
          titleSize={TitleSize.Medium}
          titleIconProps={{ iconName: "Rocket" }}
          commandBarItems={this._commandBarItems} />
        <div className="page-content page-content-top">
          <ReleaseApprovalGrid ref={this._releaseGrid} />
        </div>
      </Page>
    );
  }

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
