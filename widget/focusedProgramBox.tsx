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
		halign: Gtk.Align.CENTER,
		hscrollbarPolicy: Gtk.PolicyType.EXTERNAL,
		vscrollbarPolicy: Gtk.PolicyType.NEVER,
	})

	const viewport = new Gtk.Viewport()
	scrolledWindow.set_child(viewport)

	viewport.set_child(children)

	let scrollPos = 0
	let direction = 1
	let pauseUntil = 0
	const PAUSEUNTIL_TIMEDELTA = 2000

	const SCROLL_UPDATE_PERIOD = 50

	GLib.timeout_add(GLib.PRIORITY_DEFAULT, SCROLL_UPDATE_PERIOD, () => {
		const adj = scrolledWindow.get_hadjustment()
		if (!adj) return GLib.SOURCE_CONTINUE

		const now = Date.now()
		if (now < pauseUntil) {
			//console.log("skipping until", pauseUntil)
			return GLib.SOURCE_CONTINUE
		}

		scrollPos += direction * 0.85

		const maxScroll = adj.upper - adj.page_size
		if (scrollPos >= maxScroll) {
			scrollPos = maxScroll
			direction = -1
			pauseUntil = now + PAUSEUNTIL_TIMEDELTA
		} else if (scrollPos <= 0) {
			scrollPos = 0
			direction = 1
			pauseUntil = now + PAUSEUNTIL_TIMEDELTA
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
			{/* @ts-ignore - Marquee has a problem with passing in With, even though it resolves to a correct widget eventually at runtime */}
			<Marquee width={600}>
				<box halign={Gtk.Align.CENTER}>
					<With value={focusedWindowAccessor}>
						{(value) => {
							return (
								<label
									cssName={"focusedWindowLabel"}
									maxWidthChars={10}
									halign={Gtk.Align.CENTER}
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
