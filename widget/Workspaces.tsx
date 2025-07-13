import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import { Accessor, For, createState } from "ags"
import {
	store, callbackKeys, storeKeys,
	getWorkspaceObj, getMonitorObj,
	subscribeToUpdates,
	EventPayload,
	getAllWorkspaces,
	WorkspaceObject,
	MonitorObject
} from "../src/stores/HyprlandInfoStore"

function WorkspaceButton({ workspaceObj, active }: { workspaceObj: WorkspaceObject, active: boolean }) {
	//console.log(`creating workspace button with id ${workspace.id} : ${workspace}`)
	return (
		<button
			onClicked={() => {
				execAsync(`hyprctl dispatch moveworkspacetomonitor ${workspaceObj.id} current`).then(console.log)
				execAsync(`hyprctl dispatch workspace ${workspaceObj.id}`).then(console.log)
			}}
			hexpand
			halign={Gtk.Align.CENTER}
			class={[active ? 'active' : ''].join(' ')}
		>
			<label label={workspaceObj.name} />
		</button>
	)
}

export default function Workspaces({ monitorId }: { monitorId: number }) {

	const monitorObj = getMonitorObj(monitorId) as MonitorObject
	const [activeWorkspace, setActiveWorkspace] = createState(monitorObj.activeWorkspace)
	const getWorkspaceInfo = (w: WorkspaceObject) => { return { id: w.id, name: w.name, active: w.id == activeWorkspace.get() } }

	const [workspaces, setWorkspaces] = createState(getAllWorkspaces().map(getWorkspaceInfo))
	subscribeToUpdates(callbackKeys.WORKSPACE_ADDED, (payload: Readonly<EventPayload>) => {
		setWorkspaces(payload.workspaces.map(getWorkspaceInfo))
		//console.log(workspaces.get())
	})
	subscribeToUpdates(callbackKeys.WORKSPACE_REMOVED, (payload: Readonly<EventPayload>) => {
		setWorkspaces(payload.workspaces.map(getWorkspaceInfo))
		//console.log(workspaces.get())
	})
	subscribeToUpdates(callbackKeys.WORKSPACE_CHANGED, (payload: Readonly<EventPayload>) => {
		for (let monObj of payload.monitors) {
			//console.log(monitorObj.id, monObj.id)
			if (monObj.id == monitorObj.id) {
				//console.log(activeWorkspace.get(), monObj.activeWorkspace)
				if (activeWorkspace.get() != monObj.activeWorkspace) {
					setActiveWorkspace(monObj.activeWorkspace)
				}
				break;
			}
		}

		setWorkspaces(payload.workspaces.map(getWorkspaceInfo))
		//console.log(monitorObj.activeWorkspace,activeWorkspace)
	})


	return (
		<box>
			<For each={workspaces}>
				{(item, index) =>
					<WorkspaceButton
						workspaceObj={getWorkspaceObj(item.id)!}
						active={item.active}
					/>
				}
			</For>
		</box>
	)
}

