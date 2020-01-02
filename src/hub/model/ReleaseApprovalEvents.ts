import Events = require('events');

export declare const enum EventType {
    RefreshGrid = 0,
    ClearGridSelection = 1,
    RejectSingleRelease = 2,
    RejectAllReleases = 3,
    ApproveSingleRelease = 4,
    ApproveAllReleases = 5
}

export namespace ReleaseApprovalEvents {
    export const events = new Events.EventEmitter();

    export function subscribe(type: EventType, listener: Events.Listener): void {
        events.on(type, listener);
    }

    export function unsubscribe(type: EventType, listener: Events.Listener): void {
        events.off(type, listener);
    }

    export function fire(type: EventType, ...args: any[]): void {
        events.emit(type, ...args);
    }
}