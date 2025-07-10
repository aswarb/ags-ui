import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import Hyprland from "gi://AstalHyprland"
import { Accessor, For, createState } from "ags"
import { store, Keys } from "../src/stores/HyprlandInfoStore"

function WorkspaceButton({ workspace }: { workspace: Hyprland.Workspace}) {
	const name = workspace.get_name()
	const id = workspace.get_id()
	//console.log(`creating workspace button with id ${workspace.id} : ${workspace}`)
	return (
		<button
			onClicked={() => {
				execAsync(`hyprctl dispatch moveworkspacetomonitor ${id} current`).then(console.log)
				execAsync(`hyprctl dispatch workspace ${id}`).then(console.log)
			}}
			hexpand
			halign={Gtk.Align.CENTER}
			//class={[isActive != undefined && isActive.get() ? 'active' : ''].join(' ')}
		>
			<label label={name} />
		</button>
	)
}

export default function Workspaces({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
	const hyprland = Hyprland.get_default()
	const workspaces = store.getValue(Keys.ALL_WORKSPACES)

	return (
		<box>
			<For each={workspaces}>
				{(item, index) =>
					<WorkspaceButton
						workspace={hyprland.get_workspace(item)}
					/>
				}
			</For>
		</box>
	)
}

