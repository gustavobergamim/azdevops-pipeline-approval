import * as React from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import ReleaseApprovalGrid from "@src-root/hub/components/grid/grid.component";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { ReleaseApprovalEvents, EventType } from "./model/ReleaseApprovalEvents";

class Hub extends React.Component<{}> {

  _releaseGrid: React.RefObject<ReleaseApprovalGrid>;

  constructor(props: {}) {
    super(props);
    this._releaseGrid = React.createRef();
    SDK.init();
  }

  render(): JSX.Element {
    return (
      <Page className="flex-grow">
        <Header
          title={"Releases to Approve"}
          titleSize={TitleSize.Medium}
          titleIconProps={{ iconName: "Rocket" }}
          commandBarItems={this._createCommandBarItems} />
        <div className="page-content page-content-top">
          <ReleaseApprovalGrid ref={this._releaseGrid} />
        </div>
      </Page>
    );
  }

  private _createCommandBarItems: IHeaderCommandBarItem[] = [
    {
      id: "approve-all",
      iconProps: {
        iconName: "CheckMark"
      },
      important: true,
      onActivate: () => ReleaseApprovalEvents.fire(EventType.ApproveAllReleases),
      text: "Approve All",
      isPrimary: true
    },
    {
      id: "reject-all",
      iconProps: {
        iconName: "Cancel"
      },
      important: true,
      className: "danger",
      onActivate: () => ReleaseApprovalEvents.fire(EventType.RejectAllReleases),
      text: "Reject All"
    },
    {
      id: "refresh",
      iconProps: {
        iconName: "Refresh"
      },
      important: true,
      onActivate: () => ReleaseApprovalEvents.fire(EventType.RefreshGrid),
      text: "Refresh"
    }
  ];
}

ReactDOM.render(<Hub />, document.getElementById("root"));
