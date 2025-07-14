import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import { Accessor, For, With, createState } from "ags"
import {
	store, storeKeys,
	MonitorObject,
	getMonitorObj,
	getWindowObj
} from "../src/stores/HyprlandInfoStore"



export default function FocusedProgramBox({ monitorId }: { monitorId: number }) {

	const monitorObj = getMonitorObj(monitorId) as MonitorObject

	const focusedWindowAccessor = store.getValue(storeKeys.FOCUSED_WINDOW)

	return (
		<box halign={Gtk.Align.START}>
			<With value={focusedWindowAccessor}>
				{(value) => {
					const windowObj = getWindowObj(value)
					return <label label={windowObj == null ? value : windowObj.name} />
				}}
			</With>
		</box >
	)
}

