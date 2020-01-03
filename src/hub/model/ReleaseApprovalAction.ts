export declare const enum ActionType {
    Reject = 0,
    Approve = 1
}

export class ReleaseApprovalAction {

    static Approve: ReleaseApprovalAction = new ReleaseApprovalAction(ActionType.Approve, "approval", "approve", true);
    static Reject: ReleaseApprovalAction = new ReleaseApprovalAction(ActionType.Reject, "rejection", "reject");

    private _type: ActionType;
    private _title: string;
    private _action: string;
    private _allowDefer: boolean;

    private constructor(type: ActionType, title: string, action: string, allowDefer: boolean = false) {
        this._type = type;
        this._title = title;
        this._action = action;
        this._allowDefer = allowDefer;
    }

    get type(): ActionType {
        return this._type;
    }

    get title(): string {
        return this._title;
    }

    get action(): string {
        return this._action;
    }

    get allowDefer(): boolean {
        return this._allowDefer;
    }
}