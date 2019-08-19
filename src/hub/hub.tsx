import * as React from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import ReleaseApprovalGrid from "./components/releaseapproval-grid/releaseapproval-grid.component";


class Hub extends React.Component<{}> {
  
  constructor(props: {}) {
    super(props);
  }

  public componentDidMount() {
    SDK.init();
  }

  public render(): JSX.Element {
    return (
      <Page className="flex-grow">
        <Header
          title={"Releases to Approve"}
          titleSize={TitleSize.Medium}
          titleIconProps={{ iconName: "Rocket" }}
        />
        <div className="page-content page-content-top">
          <ReleaseApprovalGrid  />
        </div>
      </Page>
    );
  }
}

ReactDOM.render(<Hub />, document.getElementById("root"));
