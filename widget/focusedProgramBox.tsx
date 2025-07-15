import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import Pango from "gi://Pango"
import { Accessor, For, With, createState } from "ags"
import {
	store, storeKeys,
	MonitorObject,
	getMonitorObj,
	getWindowObj
} from "../src/stores/HyprlandInfoStore"
import GLib from "gi://GLib?version=2.0"


function Marquee({ width, children }: { width: number, children: Gtk.Widget }): Gtk.Widget {
	const scrolledWindow = new Gtk.ScrolledWindow({
		widthRequest: width,
		hexpand: false,
		hscrollbarPolicy: Gtk.PolicyType.EXTERNAL,
		vscrollbarPolicy: Gtk.PolicyType.NEVER,
	})

	const viewport = new Gtk.Viewport()
	scrolledWindow.set_child(viewport)

	viewport.set_child(children)

	let scrollPos = 0
	let direction = 1

	GLib.timeout_add(GLib.PRIORITY_DEFAULT, 30, () => {
		const adj = scrolledWindow.get_hadjustment()
		if (!adj) return GLib.SOURCE_CONTINUE

		scrollPos += direction * 1
		const maxScroll = adj.upper - adj.page_size

		if (scrollPos >= maxScroll) {
			scrollPos = maxScroll
			direction = -1
		} else if (scrollPos <= 0) {
			scrollPos = 0
			direction = 1
		}

		adj.value = scrollPos

		return GLib.SOURCE_CONTINUE
	})

	return scrolledWindow
}

export default function FocusedProgramBox({ monitorId }: { monitorId: number }) {

	const monitorObj = getMonitorObj(monitorId) as MonitorObject
	const focusedWindowAccessor = store.getValue(storeKeys.FOCUSED_WINDOW_TITLE)
	return (
		<box halign={Gtk.Align.CENTER} hexpand>
			{/* @ts-ignore - This has a problem with passing in With, even though it resolves to a correct widget eventually at runtime */}
			<Marquee width={550}>
				<box>
					<With value={focusedWindowAccessor}>
						{(value) => {
							return (
								<label
									cssName={"focusedWindowLabel"}
									maxWidthChars={10}
									ellipsize={Pango.EllipsizeMode.NONE}
									overflow={Gtk.Overflow.VISIBLE}
									singleLineMode={true}
									label={value}
								/>
							)
						}}
					</With>
				</box>
			</Marquee>
		</box>
	)
}
