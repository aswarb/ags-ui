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
import GLib from "gi://GLib";


function WorkspaceButton({ workspaceObj, active, focused }: { workspaceObj: WorkspaceObject, active: boolean, focused: boolean }) {
	return (
		<button
			onClicked={() => {
				execAsync(`${GLib.get_home_dir()}/.config/hypr/scripts/switch_to_workspace.sh ${workspaceObj.id}`).then(console.log)
			}}
			halign={Gtk.Align.CENTER}
			valign={Gtk.Align.CENTER}
			class={[active ? 'active' : '', focused ? 'focused' : ''].join(' ')}
		>
		</button>
	)
}

export default function Workspaces({ monitorId }: { monitorId: number }) {

	const monitorObj = getMonitorObj(monitorId) as MonitorObject
	const [activeWorkspace, setActiveWorkspace] = createState(monitorObj.activeWorkspace)
	const getWorkspaceInfo = (w: WorkspaceObject) => {
		console.log(w.id, w.monitorId, monitorObj.id)
		const thisMonitor = getMonitorObj(w.monitorId)
		return {
			id: w.id,
			name: w.name,
			active: w.id === thisMonitor?.activeWorkspace,
			focused: w.id === activeWorkspace.get() && w.monitorId === monitorObj.id
		}
	}

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
		payload.monitors.map((monObj) => {

		})
		for (let monObj of payload.monitors) {

			if (monObj.id == monitorObj.id) {
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
		<box
			halign={Gtk.Align.START}
			valign={Gtk.Align.BASELINE_CENTER}
			class="workspacebox"
			$={(self: Gtk.Box) => {
				const scrollEventController = new Gtk.EventControllerScroll({
					flags: Gtk.EventControllerScrollFlags.VERTICAL | Gtk.EventControllerScrollFlags.HORIZONTAL
				})
				self.add_controller(scrollEventController)
				scrollEventController.connect("scroll", (_event, dx: number, dy: number) => {
					if (dy < 0) {
						console.log("scroll down")
						return
					} else if (dy > 0) {
						console.log("scroll up")
						return
					}
					if (dx < 0) {
						console.log("scroll left")
						return
					} else if (dx < 0) {
						console.log("scroll right")
						return
					}
				})
			}}
		>
			<For each={workspaces}>
				{(item, index) =>
					<WorkspaceButton
						workspaceObj={getWorkspaceObj(item.id)!}
						active={item.active}
						focused={item.focused}
					/>
				}
			</For>
		</box>
	)
}

