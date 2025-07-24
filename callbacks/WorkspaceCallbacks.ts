
import { execAsync } from "ags/process"
import GLib from "gi://GLib";

export const SwitchToWorkspace = (id: number) => {
	execAsync(`${GLib.get_home_dir()}/.config/hypr/scripts/switch_to_workspace.sh ${id}`).then(console.log)
}
