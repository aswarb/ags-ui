import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import { createPoll } from "ags/time"

import Workspaces from "./Workspaces"
import FocusedProgramBox from "./focusedProgramBox"
import SysTray from "./Tray"

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

					<FocusedProgramBox monitorId={monitorId} />
				</box>
				<box $type="center" width_request={100} >

					<menubutton >
						<label label={time} />
						<popover>
							<Gtk.Calendar />
						</popover>
					</menubutton>
				</box>
				<box $type="end" hexpand halign={Gtk.Align.END}>
				<SysTray />
				</box>
			</centerbox>
		</window>
	)
}
