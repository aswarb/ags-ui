import { execAsync } from "ags/process"
import GLib from "gi://GLib";

export const showAppMenu = (callback: () => void) => {
	execAsync(`${GLib.get_home_dir()}/.config/hypr/scripts/showAppMenu.sh`)
		.then(console.log).then(() => callback()).catch(e => console.log(e))
	
}
