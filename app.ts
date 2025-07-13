import app from "ags/gtk4/app"
import style from "./style.scss"
import Bar from "./widget/Bar"
import { getAllMonitors } from "./src/stores/HyprlandInfoStore"


const monitors = getAllMonitors()
app.start({
	css: style,
	main() {
		app.get_monitors().map((monitor, index) => {
			console.log(index, monitors[index])
			return Bar(monitor, monitors[index].id)
		})
	},
})
