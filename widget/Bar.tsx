import { App } from "astal/gtk3"
import { Variable, GLib, bind } from "astal"
import { Astal, Gtk, Gdk } from "astal/gtk3"
import Hyprland from "gi://AstalHyprland"
import Mpris from "gi://AstalMpris"
import Battery from "gi://AstalBattery"
import Wp from "gi://AstalWp"
import Network from "gi://AstalNetwork"
import Tray from "gi://AstalTray"

function SysTray() {
  const tray = Tray.get_default()

  return <box className="Tray">
    {bind(tray, "items").as(items => items.map(item => {
      if (item.iconThemePath)
        App.add_icons(item.iconThemePath)

      const menu = item.create_menu()

      return <button
        tooltipMarkup={bind(item, "tooltipMarkup")}
        onDestroy={() => menu?.destroy()}
        onClickRelease={self => {
          menu?.popup_at_widget(self, Gdk.Gravity.SOUTH, Gdk.Gravity.NORTH, null)
        }}>
        <icon gIcon={bind(item, "gicon")} />
      </button>
    }))}
  </box>
}

function Wifi() {
  const { wifi } = Network.get_default()

  return <icon
    tooltipText={bind(wifi, "ssid").as(String)}
    className="Wifi"
    icon={bind(wifi, "iconName")}
  />
}

function Audio() {
  const speaker = Wp.get_default()?.audio.defaultSpeaker!

  return <box className="Audio">
    <icon icon={bind(speaker, "volumeIcon")} />
    <label label={bind(speaker, "volume").as(v => `${Math.floor(v * 100)} %`)}/>
  </box>
}

function BatteryLevel() {
  const bat = Battery.get_default()

  const classes = bind(bat, "percentage").as(n => {
    const base = "Battery"

    if (n >= 0.75) {
      return `${base} High`
    }

    if (n <= 0.25) {
      return `${base} Low`
    }

    return `${base} Medium`
  });

  return <box className={classes}
    visible={bind(bat, "isPresent")}>
    <icon icon={bind(bat, "batteryIconName")} />
    <label label={bind(bat, "percentage").as(p =>
      `${Math.floor(p * 100)} %`
    )} />
  </box>
}

function Media() {
  const mpris = Mpris.get_default()

  return <box className="Media">
    {bind(mpris, "players").as(ps => ps[0] ? (
      <box>
        <box
          className="Cover"
          valign={Gtk.Align.CENTER}
          css={bind(ps[0], "coverArt").as(cover =>
            `background-image: url('${cover}');`
          )}
        />
        <label
          label={bind(ps[0], "title").as(() =>
            `${ps[0].title} - ${ps[0].artist}`
          )}
        />
      </box>
    ) : (
      "Nothing Playing"
    ))}
  </box>
}

function Workspaces() {
  const hypr = Hyprland.get_default()

  return <box className="Workspaces">
    {bind(hypr, "workspaces").as(wss => wss
      .sort((a, b) => a.id - b.id)
      .map(ws => (
        <button
          className={bind(hypr, "focusedWorkspace").as(fw =>
            ws === fw ? "focused" : "")}
          onClicked={() => ws.focus()}>
          {ws.id}
        </button>
      ))
    )}
  </box>
}

function FocusedClient() {
  const hypr = Hyprland.get_default()
  const focused = bind(hypr, "focusedClient")

  const truncate = (str: string) => {
    const maxLength = 30
    if (str.length > maxLength) {
      return str.slice(0, maxLength) + "...";
    }
    return str;
  }

  return <box
    className="Focused"
    visible={focused.as(Boolean)}>
    {focused.as(client => (
      client && <label label={bind(client, "title").as(String).as(truncate)} />
    ))}
  </box>
}

function Time({ format = "%H:%M" }) {
  const time = Variable<string>("").poll(1000, () =>
    GLib.DateTime.new_now_local().format(format)!)

  return <label
    className="Time"
    onDestroy={() => time.drop()}
    label={time()}
  />
}

export default function Bar(monitor: Gdk.Monitor) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  return <window
    className="Bar"
    gdkmonitor={monitor}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    anchor={TOP | LEFT | RIGHT}>
    <centerbox>
      <box hexpand halign={Gtk.Align.START} className="Section">
        <Workspaces />
        <FocusedClient />
      </box>
      <box hexpand halign={Gtk.Align.CENTER} className="Section">
        <Time />
      </box>
      <box hexpand halign={Gtk.Align.END} className="Section">
        <SysTray />
        <Wifi />
        <Audio />
        <BatteryLevel />
      </box>
    </centerbox>
  </window>
}
