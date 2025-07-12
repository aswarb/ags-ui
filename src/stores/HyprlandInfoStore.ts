import { Accessor, createState } from "ags";
import Hyprland from "gi://AstalHyprland";
import { DefaultStore } from "./AGSStore";

export interface WorkspaceObject {
	id: number;
	name: string;
	monitorId: number;
	clientAddresses: string[];
	hasFullscreen: boolean;
}

export interface WindowObject {
	address: string;
	name: string;
	focused: boolean;
	fullscreen: boolean;
	floating: boolean;
}

export interface MonitorObject {
	id: number;
	ativeWorkspace: number;
	focused: boolean;
	disabled: boolean;
}

enum storeKeys {
	ALL_WORKSPACES = "WORKSPACES",
	MONITORS = "MONITORS",
	FOCUSED_WORKSPACE = "FOCUSED_WORKSPACE",
	ACTIVE_WORKSPACE = "ACTIVE_WORKSPACE",
	FOCUSED_CLIENT = "FOCUSED_CLIENT",
}
enum callbackKeys {
	WORKSPACE_CHANGED = "WORKSPACE_CHANGED",
	WORKSPACE_ADDED = "WORKSPACE_ADDED",
	WORKSPACE_REMOVED = "WORKSPACE_REMOVED",
	MONITOR_ADDED = "MONITOR_ADDED",
	MONITOR_REMOVED = "MONITOR_REMOVED",
}

let listenerIdCounter = 0;
const activeListeners = {} as Record<callbackKeys, Set<number>>;

// Cast the values since we know they're the enum values
const actualCallbackKeys = Object.keys(callbackKeys) as Array<
	keyof typeof callbackKeys
>;
for (const key of actualCallbackKeys) {
	const k = callbackKeys[key];
	activeListeners[k] = new Set();
}

const hyprland = Hyprland.get_default();

const monitors = new Map<number, Hyprland.Monitor>();
const workspaces = new Map<number, Hyprland.Workspace>();
const clients = new Map<string, Hyprland.Client>();

const activeWorkspaceListenerIds = new Map<number, number[]>();
const [focusedWorkspaceId, setFocusedWorkspaceId] = createState("");

const onWorkspaceAdded = (workspace: Hyprland.Workspace) => {
	const id = workspace.id;
	workspaces.set(id, workspace);
};
const onWorkspaceRemoved = (workspace: Hyprland.Workspace) => {
	const id = workspace.id;
	workspaces.delete(id);
};

const onMonitorConnect = (monitor: Hyprland.Monitor) => {
	const id = monitor.id;

	const lId = monitor.connect(
		"notify::active-workspace",
		(mon: Hyprland.Monitor, _b: unknown) => {
			console.log(
				mon.active_workspace.id,
				mon.active_workspace.monitor.id,
			);
		},
	);

	if (activeWorkspaceListenerIds.get(id) != undefined) {
		activeWorkspaceListenerIds.set(id, [] as number[]);
	}
	activeWorkspaceListenerIds.get(id)?.push(lId);

	monitors.set(id, monitor);
};

const onMonitorDisconnect = (monitor: Hyprland.Monitor) => {
	const id = monitor.id;
	const arr = activeWorkspaceListenerIds.get(id);
	arr?.forEach((id) => {
		monitor.disconnect(id);
	});
	activeWorkspaceListenerIds.delete(id);
	monitors.delete(id);
};

hyprland.connect(
	"workspace-added",
	(_obj: Hyprland.Hyprland, workspace: Hyprland.Workspace) =>
		onWorkspaceAdded(workspace),
);
hyprland.connect(
	"workspace-removed",
	(_obj: Hyprland.Hyprland, workspace: Hyprland.Workspace) =>
		onWorkspaceRemoved(workspace),
);
hyprland.connect(
	"monitor-added",
	(_obj: Hyprland.Hyprland, mon: Hyprland.Monitor) => onMonitorConnect(mon),
);
hyprland.connect(
	"monitor-removed",
	(_obj: Hyprland.Hyprland, mon: Hyprland.Monitor) =>
		onMonitorDisconnect(mon),
);

const values = {
	[storeKeys.FOCUSED_WORKSPACE]: focusedWorkspaceId,
};
const setters = {
	[storeKeys.FOCUSED_WORKSPACE]: setFocusedWorkspaceId,
};

const store = new DefaultStore(values, setters);

function onSubscriptableEvent<T extends {}>(eventkey: callbackKeys, data: T) {
	switch (eventkey) {
		case callbackKeys.MONITOR_ADDED:
			break;
		case callbackKeys.MONITOR_REMOVED:
			break;
		case callbackKeys.WORKSPACE_ADDED:
			break;
		case callbackKeys.WORKSPACE_CHANGED:
			break;
		case callbackKeys.WORKSPACE_REMOVED:
			break;
	}
}

export function subscribeToUpdates(key: callbackKeys): number | null {
	if (activeListeners[key] != null) {
		activeListeners[key].add(listenerIdCounter);
		listenerIdCounter++;
		return listenerIdCounter - 1;
	}
	return null;
}

export function unsubscribeFromUpdates(
	key: callbackKeys,
	listenerId: number,
): void {
	activeListeners[key]?.delete(listenerId);
}

export { callbackKeys, store, storeKeys };
