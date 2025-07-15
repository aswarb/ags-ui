import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import { createPoll } from "ags/time"

import Workspaces from "./Workspaces"
import FocusedProgramBox from "./focusedProgramBox"


export default function Bar(gdkmonitor: Gdk.Monitor, monitorId: number) {
	const time = createPoll("", 950, "date")
	const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

	return (
		<window
			visible
			name="bar"
			class="Bar"
			gdkmonitor={gdkmonitor}
			exclusivity={Astal.Exclusivity.EXCLUSIVE}
			anchor={TOP | LEFT | RIGHT}
			application={app}
		>

			<centerbox cssName="centerbox">
				<box $type="start" homogeneous={false}>
					<Workspaces monitorId={monitorId} />
				</box>
				<box $type="center" width_request={100} >
					<FocusedProgramBox  monitorId={monitorId} />
				</box>
				<box $type="end" hexpand halign={Gtk.Align.END}>
				<menubutton >
					<label label={time} />
					<popover>
						<Gtk.Calendar />
					</popover>
				</menubutton></box>
			</centerbox>
		</window>
	)
}
