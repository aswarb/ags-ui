
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { Accessor, For, With, createState } from "ags"

import { showAppMenu } from "@callbacks/AppMenuCallbacks"

export default function AppLauncher() {

	const [appLauncherState, setAppLauncherState] = createState(true)

	return (<button
		sensitive={appLauncherState.get()}
		$={(self: Gtk.Button) => {
			const pressListener = self.connect("clicked", (self: Gtk.Button) => {
				setAppLauncherState(!appLauncherState.get())
				showAppMenu(() => { setAppLauncherState(!appLauncherState.get()) })
			})

			appLauncherState.subscribe(() => {
				self.set_sensitive(appLauncherState.get())
			})

		}}>
		<label label="Applications"
		/>
	</button>
	)
}
