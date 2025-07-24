import { Accessor, With, For, createState, createBinding } from "ags"
import { Gtk } from "ags/gtk4";
import AstalTray from "gi://AstalTray"
import Gio from "gi://Gio"
import GLib from "gi://GLib";

export default function SysTray() {
	const tray = AstalTray.get_default();

	return (
		<revealer
			visible={tray.get_items().length > 0}
			revealChild={tray.get_items().length > 0}
			transitionDuration={300}
			transitionType={Gtk.RevealerTransitionType.SLIDE_LEFT}
			$={(self: Gtk.Revealer) => {
				tray.connect("notify::items", () => {
					if (tray.get_items().length > 0) {
						self.visible = true;
						self.reveal_child = true;
					} else {
						self.reveal_child = false;
						setTimeout(() => {
							self.visible = false;
						}, 300);
					}
				});
			}}
		>
			<box spacing={4} hexpand={false} valign={Gtk.Align.CENTER}>
				<For each={createBinding(tray, "items")}>
					{(item: AstalTray.TrayItem, _index) => {
						return (
							<menubutton
								class="bar__tray-item"
								tooltipMarkup={createBinding(item, "tooltipMarkup")}
								$={(self: Gtk.MenuButton) => {
									self.insert_action_group(`dbusmenu`, item.actionGroup)
									const actionGroupListner = item.connect("notify::action-group", () => {
										console.log("action group changed")
										self.insert_action_group(`dbusmenu`, item.actionGroup)
									})

									const menuModelListener = item.connect("notify::menu-model", () => {
										self.set_menu_model(item.menu_model);  // Attach new
										self.insert_action_group(`dbusmenu`, item.actionGroup)
									});

									self.connect("destroy", () => {
										item.disconnect(actionGroupListner)
										item.menu_model.disconnect(menuModelListener)
									})

									self.connect("activate", (self: Gtk.MenuButton) => {
									})
								}}
								menu_model={item.menu_model}

							>

								<image gicon={createBinding(item, "gicon")} />
							</menubutton>
						);
					}}
				</For>
			</box>
		</revealer>)
}
