import * as React from "react";
import { Card } from "azure-devops-ui/Card";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Customizer, Fabric, DatePicker, DayOfWeek, initializeIcons } from "office-ui-fabric-react";
import { DatePickerStrings, DatePickerControlClass } from "@src-root/hub/model/officeui-datepicker.types";
import { DropdownSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";

export interface IDialogDeferredDeploymentProps {
    onSelectDate?: (selectedDate?: Date) => void;
}

export class DialogDeferredDeployment extends React.Component<IDialogDeferredDeploymentProps> {

    private _deferredDeploymentHidden: ObservableValue<boolean> = new ObservableValue<boolean>(true);

    private _defaultPickerDate: Date = new Date();
    private _deferredDeploymentHourSelection = new DropdownSelection();
    private _deferredDeploymentMinuteSelection = new DropdownSelection();

    private _selectedDate: Date = new Date();
    private _selectedHour: number = 0;
    private _selectedMinute: number = 0;

    _deferredDeploymentInvalidDate = new ObservableValue<boolean>(false);

    constructor(props: IDialogDeferredDeploymentProps) {
        super(props);
        this.initializeDefaults();
        initializeIcons();
    }

    render(): JSX.Element {
        return (<Card
            className="flex-grow"
            collapsible={true}
            collapsed={this._deferredDeploymentHidden}
            onCollapseClick={() => this._deferredDeploymentHidden.value = !this._deferredDeploymentHidden.value}
            titleProps={{ text: "Defer deployment for later" }} >
            <div>
                <div className="flex-row">
                    <Customizer>
                        <Fabric>
                            <DatePicker
                                className={DatePickerControlClass.control}
                                firstDayOfWeek={DayOfWeek.Sunday}
                                strings={DatePickerStrings}
                                placeholder="Date"
                                minDate={new Date()}
                                value={this._defaultPickerDate}
                                onSelectDate={this.onSelectDeferredDeploymentDate} />
                        </Fabric>
                    </Customizer>
                    <Dropdown
                        className={DatePickerControlClass.control}
                        placeholder="Hour"
                        items={this.getDefferedDeploymentListBoxItems(24, 'h')}
                        showFilterBox={false}
                        selection={this._deferredDeploymentHourSelection}
                        onSelect={this.onSelectDeferredDeploymentHour} />
                    <Dropdown
                        className={DatePickerControlClass.control}
                        placeholder="Minute"
                        items={this.getDefferedDeploymentListBoxItems(60, 'm')}
                        showFilterBox={false}
                        selection={this._deferredDeploymentMinuteSelection}
                        onSelect={this.onSelectDeferredDeploymentMinute} />
                </div>
                <ConditionalChildren renderChildren={this._deferredDeploymentInvalidDate}>
                    <div className="flex-row" style={{ marginBottom: "10px" }}>
                        <MessageCard
                            className="flex-self-stretch"
                            severity={MessageCardSeverity.Error} >
                            The specified date for deferring the deployment is in the past. The date should be in the future.
                                </MessageCard>
                    </div>
                </ConditionalChildren>
            </div>
        </Card>);
    }

    initializeDefaults(): void {
        let defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 1);
        this._defaultPickerDate = this._selectedDate = defaultDate;
        this._deferredDeploymentHourSelection.select(0);
        this._deferredDeploymentMinuteSelection.select(0);
        this.validateDeferredDeploymentDate();
    }

    private getDefferedDeploymentListBoxItems(quantity: number, suffix: string): IListBoxItem<{}>[] {
        let items = [];
        for (let index = 0; index < quantity; index++) {
            items.push({ id: index.toString(), text: `${index.toString().padStart(2, '0')}${suffix}` });
        }
        return items;
    }

    private onSelectDeferredDeploymentDate = (date: Date | null | undefined): void => {
        if (!date) return;
        this._selectedDate = date;
        this.validateDeferredDeploymentDate();
    }

    private onSelectDeferredDeploymentHour = (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<{}>) => {
        this._selectedHour = +item.id;
        this.validateDeferredDeploymentDate();
    }

    private onSelectDeferredDeploymentMinute = (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<{}>) => {
        this._selectedMinute = +item.id;
        this.validateDeferredDeploymentDate();
    }

    validateDeferredDeploymentDate(): boolean {
        this._selectedDate.setHours(this._selectedHour);
        this._selectedDate.setMinutes(this._selectedMinute);
        this._deferredDeploymentInvalidDate.value = new Date() >= this._selectedDate;
        if (!this._deferredDeploymentInvalidDate.value && this.props.onSelectDate) {
            this.props.onSelectDate(this._selectedDate);
        }
        return !this._deferredDeploymentInvalidDate.value;
    }

    get selectedDate() {
        return this.validateDeferredDeploymentDate() ? this._selectedDate : null;
    }
}