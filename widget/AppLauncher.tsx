
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { Accessor, For, With, createState } from "ags"

import { showAppMenu } from "@callbacks/AppMenuCallbacks"
import { appRunnerState, setAppRunnerState } from "src/sharedState/appRunnerState"

export default function AppLauncher() {

	return (<button
		sensitive={appRunnerState.get()}
		$={(self: Gtk.Button) => {
			const pressListener = self.connect("clicked", (self: Gtk.Button) => {
				setAppRunnerState(!appRunnerState.get())
				showAppMenu(() => { setAppRunnerState(!appRunnerState.get()) })
			})

			appRunnerState.subscribe(() => {
				self.set_sensitive(appRunnerState.get())
			})

		}}>
		<label label="Applications"
		/>
	</button>
	)
}
