import * as React from "react";
import * as ReactDOM from "react-dom";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import ReleaseApprovalGrid from "./components/releaseapproval-grid/releaseapproval-grid.component";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";


class Hub extends React.Component<{}> {

  _releaseGrid: React.RefObject<ReleaseApprovalGrid>;

  constructor(props: {}) {
    super(props);
    this._releaseGrid = React.createRef();
  }

  render(): JSX.Element {
    return (
      <Page className="flex-grow">
        <Header
          title={"Releases to Approve"}
          titleSize={TitleSize.Medium}
          titleIconProps={{ iconName: "Rocket" }}
          commandBarItems={this._createCommandBarItems}
        />
        <div className="page-content page-content-top">
          <ReleaseApprovalGrid
            ref={this._releaseGrid} />
        </div>
      </Page>
    );
  }

  _createCommandBarItems: IHeaderCommandBarItem[] = [
    {
      id: "approve-all",
      iconProps: {
        iconName: "CheckMark"
      },
      important: true,
      onActivate: () => {
        const grid = this._releaseGrid.current as ReleaseApprovalGrid;
        if (grid != null) {
          grid.approveAll();
        }
      },
      text: "Approve All",
      isPrimary: true
    },
    {
      id: "reject-all",
      iconProps: {
        iconName: "Cancel"
      },
      important: true,
      onActivate: () => {
        const grid = this._releaseGrid.current as ReleaseApprovalGrid;
        if (grid != null) {
          grid.rejectAll();
        }
      },
      text: "Reject All"
    }
  ];
}

ReactDOM.render(<Hub />, document.getElementById("root"));
