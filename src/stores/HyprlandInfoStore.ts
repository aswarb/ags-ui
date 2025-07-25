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
	activeWorkspace: number;
	focused: boolean;
	disabled: boolean;
}

export interface EventPayload {
	workspaces: WorkspaceObject[];
	windows: WindowObject[];
	monitors: MonitorObject[];
}

type EventCallback = (payload: Readonly<EventPayload>) => void

enum storeKeys {
	ALL_WORKSPACES = "WORKSPACES",
	MONITORS = "MONITORS",
	FOCUSED_WORKSPACE = "FOCUSED_WORKSPACE",
	FOCUSED_WINDOW = "FOCUSED_WINDOW",
	ACTIVE_WORKSPACE = "ACTIVE_WORKSPACE",
	FOCUSED_CLIENT = "FOCUSED_CLIENT",
	FOCUSED_WINDOW_TITLE = "FOCUSED_WINDOW_TITLE"
}
enum callbackKeys {
	WORKSPACE_CHANGED = "WORKSPACE_CHANGED",
	WORKSPACE_ADDED = "WORKSPACE_ADDED",
	WORKSPACE_REMOVED = "WORKSPACE_REMOVED",
	MONITOR_ADDED = "MONITOR_ADDED",
	MONITOR_REMOVED = "MONITOR_REMOVED",
	FOCUSED_WINDOW_CHANGED = "FOCUSED_WINDOW_CHANGED",
}

let listenerIdCounter = 0;
const activeListeners = {} as Record<callbackKeys, Set<number>>;
const callbackMap = new Map<number, EventCallback>();

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
const GObjectDisconnectors = {
	monitors: new Map<number, Map<number, () => void>>(),
	workspaces: new Map<number, Map<number, () => void>>(),
	clients: new Map<string, Map<number, () => void>>(),
}

const [focusedWorkspaceId, setFocusedWorkspaceId] = createState(hyprland.focused_workspace.id);
const [focusedWindowAddress, setfocusedWindowAddress] = createState(hyprland.get_focused_client().address)
const [focusedWindowTitle, setFocusedWindowTitle] = createState(hyprland.get_focused_client().title)

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
			onSubscriptableEvent(callbackKeys.WORKSPACE_CHANGED)
		},
	);
	if (GObjectDisconnectors.monitors.get(monitor.id) == undefined) {
		GObjectDisconnectors.monitors.set(monitor.id, new Map<number, () => void>)
	}

	GObjectDisconnectors.monitors.get(monitor.id)?.set(lId, () => {
		monitor.disconnect(lId);
		GObjectDisconnectors.monitors.get(monitor.id)?.delete(lId)
	})
};

for (let m of hyprland.get_monitors()) {
	onMonitorConnect(m)
}

const onMonitorDisconnect = (monitor: Hyprland.Monitor) => {
	const id = monitor.id;
	const arr = GObjectDisconnectors.monitors.get(monitor.id);
	arr?.forEach((func) => {
		func()
	});
	activeWorkspaceListenerIds.delete(id);
	monitors.delete(id);
};

hyprland.connect("workspace-added", (_obj: Hyprland.Hyprland, workspace: Hyprland.Workspace) => {
	onWorkspaceAdded(workspace)
	onSubscriptableEvent(callbackKeys.WORKSPACE_ADDED)
});
hyprland.connect("workspace-removed", (_obj: Hyprland.Hyprland, workspace: Hyprland.Workspace) => {
	onWorkspaceRemoved(workspace)
	onSubscriptableEvent(callbackKeys.WORKSPACE_REMOVED)
});
hyprland.connect("monitor-added", (_obj: Hyprland.Hyprland, monitor: Hyprland.Monitor) => {
	onMonitorConnect(monitor)
	onSubscriptableEvent(callbackKeys.MONITOR_ADDED)
});
hyprland.connect("monitor-removed", (_obj: Hyprland.Hyprland, monitor: Hyprland.Monitor) => {
	onMonitorDisconnect(monitor)
	onSubscriptableEvent(callbackKeys.MONITOR_REMOVED)
});
hyprland.connect("notify::focused-workspace", (_obj: Hyprland.Hyprland, workspace: Hyprland.Workspace) => {
	setFocusedWorkspaceId(workspace.id)
});
hyprland.connect("notify::focused-client", (obj: Hyprland.Hyprland, _window: Hyprland.Client) => {
	const oldClient = hyprland.get_client(focusedWindowAddress.get())

	if (oldClient != null) {
		const arr = GObjectDisconnectors.clients.get(oldClient.address);
		arr?.forEach((func, index) => {
			func()
		});
	}

	const client = obj.get_focused_client()
	//console.log(client)
	const lId = client.connect(
		"notify::title",
		(client: Hyprland.Client, _b: unknown) => {
			console.log(client.title)
			setFocusedWindowTitle(client.title)
			onSubscriptableEvent(callbackKeys.FOCUSED_WINDOW_CHANGED)
		},
	);

	if (GObjectDisconnectors.clients.get(client.address) == undefined) {
		GObjectDisconnectors.clients.set(client.address, new Map<number, () => void>())
	}
	GObjectDisconnectors.clients.get(client.address)?.set(lId, () => {
		client.disconnect(lId);
		GObjectDisconnectors.clients.get(client.address)?.delete(lId)
	})

	setfocusedWindowAddress(client.address)
	setFocusedWindowTitle(client.title)
	onSubscriptableEvent(callbackKeys.FOCUSED_WINDOW_CHANGED)

});

const values = {
	[storeKeys.FOCUSED_WORKSPACE]: focusedWorkspaceId,
	[storeKeys.FOCUSED_WINDOW]: focusedWindowAddress,
	[storeKeys.FOCUSED_WINDOW_TITLE]: focusedWindowTitle,
};
const setters = {
	[storeKeys.FOCUSED_WORKSPACE]: setFocusedWorkspaceId,
	[storeKeys.FOCUSED_WINDOW]: setfocusedWindowAddress,
	[storeKeys.FOCUSED_WINDOW_TITLE]: setFocusedWindowTitle,
};

const store = new DefaultStore(values, setters);

function onSubscriptableEvent(eventkey: callbackKeys) {
	const data = {
		monitors: getAllMonitors(),
		workspaces: getAllWorkspaces(),
		windows: getAllWindows(),
	} as EventPayload

	const frozenData = Object.freeze(data)

	const relevantListeners = [] as number[]
	const relevantCallbacks = [] as EventCallback[];

	for (let l of activeListeners[eventkey]) {
		relevantListeners.push(l)
		const cb = callbackMap.get(l)
		if (cb != undefined) {
			relevantCallbacks.push(cb)
		}
	}

	relevantCallbacks.forEach((cb) => { cb(frozenData) })
}

export function subscribeToUpdates(key: callbackKeys, callback: (obj: Readonly<EventPayload>) => void): number | null {
	if (activeListeners[key] != null) {
		activeListeners[key].add(listenerIdCounter);
		listenerIdCounter++;
		callbackMap.set(listenerIdCounter - 1, callback)
		return listenerIdCounter - 1;
	}
	return null;
}

export function getMonitorObj(id: number): MonitorObject | null {
	const monitor = hyprland.get_monitor(id)

	if (monitor != null) {
		return {
			id: monitor.id,
			activeWorkspace: monitor.active_workspace.id,
			focused: monitor.focused,
			disabled: monitor.disabled,
		}
	} else {
		return null
	}
}

export function getWorkspaceObj(id: number): WorkspaceObject | null {
	let workspace = hyprland.get_workspace(id)

	if (workspace != null) {
		return {
			id: workspace.id,
			name: workspace.name,
			monitorId: workspace.monitor.id,
			clientAddresses: workspace.clients.map((client) => client.address),
			hasFullscreen: workspace.hasFullscreen,
		}
	} else {
		return null
	}
}

export function getWindowObj(address: string): WindowObject | null {
	if (address == null) { return null }
	const window = hyprland.get_client(address)

	if (window != null) {
		return {
			address: window.address,
			name: window.title,
			focused: hyprland.focused_client == null ? false : hyprland.focused_client.address === window.address,
			fullscreen: window.fullscreen_client === Hyprland.Fullscreen.CURRENT,
			floating: window.floating,
		}
	} else {
		return null
	}
}

export function getAllWorkspaces(): WorkspaceObject[] {
	const all = hyprland.get_workspaces()
		.map((workspace: Hyprland.Workspace) => { return getWorkspaceObj(workspace.id) })
		.filter((obj) => obj != null)
	return all.sort((a, b) => a.id - b.id)
}
export function getAllMonitors(): MonitorObject[] {
	const all = hyprland.get_monitors()
		.map((monitor: Hyprland.Monitor) => { return getMonitorObj(monitor.id) })
		.filter((obj) => obj != null)
	return all.sort((a, b) => a.id - b.id)
}
export function getAllWindows(): WindowObject[] {
	const all = hyprland.get_clients()
		.map((window: Hyprland.Client) => { return getWindowObj(window.address) })
		.filter((obj) => obj != null)
	return all.sort((a, b) => a.address.localeCompare(b.address))
}

export function unsubscribeFromUpdates(
	key: callbackKeys,
	listenerId: number,
): void {
	activeListeners[key]?.delete(listenerId);
	callbackMap.delete(listenerId);
}

export { callbackKeys, store, storeKeys };
