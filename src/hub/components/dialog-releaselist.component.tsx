import * as React from "react";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { IReleaseApproval } from "@src-root/hub/model/IReleaseApproval";
import { ScrollableList, IListItemDetails, ListItem } from "azure-devops-ui/List";
import { IconSize, Icon } from "azure-devops-ui/Icon";
import { PillGroup } from "azure-devops-ui/PillGroup";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { Colors } from "@src-root/hub/model/Colors";

export interface IDialogReleaseListProps {
    releases?: ArrayItemProvider<IReleaseApproval>;
}

export class DialogReleaseList extends React.Component<IDialogReleaseListProps> {

    constructor(props: IDialogReleaseListProps) {
        super(props);
    }

    render(): JSX.Element {
        const releases = this.props.releases ? this.props.releases : new ArrayItemProvider<IReleaseApproval>([]);
        return (<ScrollableList
            itemProvider={releases}
            renderRow={this._renderListRow}
            width="100%" />);
    }

    _renderListRow = (
        index: number,
        item: IReleaseApproval,
        details: IListItemDetails<IReleaseApproval>,
        key?: string
    ): JSX.Element => {

        return (
            <ListItem key={key || "list-item" + index} index={index} details={details}>
                <div className="list-example-row flex-row h-scroll-hidden">
                    <Icon iconName="Rocket" size={IconSize.medium} />
                    <div
                        style={{ marginLeft: "10px", padding: "10px 0px" }}
                        className="flex-column h-scroll-hidden">
                        <PillGroup className="flex-row">
                            <Pill>{item.definition}</Pill>
                            <Pill size={PillSize.compact} variant={PillVariant.outlined}>
                                {item.number}
                            </Pill>
                            <Pill size={PillSize.compact} variant={PillVariant.colored} color={Colors.darkRedColor}>
                                {item.environment}
                            </Pill>
                        </PillGroup>
                    </div>
                </div>
            </ListItem>
        );
    };
}