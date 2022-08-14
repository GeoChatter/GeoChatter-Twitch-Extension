/// <reference path="types.d.ts" />
export namespace Setting {
  var refresh = () => {
    // TODO
    console.log("Refresh recieved")
  };
  
  export var MapId: Nullable<string> = ""
  
  export var General = {
    _3d: true,
    sens: 100,
    ex: 1,
    globe: false,
    copyAndPaste: false,
    drawerOpen: false,
    globeView: true,
    testing: false,
  } as GeneralSettings

  export var Streamer: StreamerSettings = {
    borders: false,
    borderAdmin: false,
    flags: false,
    streamOverlay: false,
    temporaryGuesses: false,
    streamer: undefined
  }

  export function changeStreamerSettings(key: keyof typeof Streamer, newVal: ValueOf<typeof Streamer>) {
    Streamer[key] = newVal
    refresh()
  }

  export function getvalues(): any {
    const values = structuredClone(General)

    for (const key of Object.keys(Streamer)) {
      if (Streamer[key] === false) {
        values[key] = Streamer[key]
      }
    }
    return values
  }

  export function initialize() {
    load()
    console.log(General)
  }

  export function load() {
    let loadedObj = JSON.parse(localStorage.getItem("settings") ?? "{}") ?? {}
    for (const key of Object.keys(loadedObj)) {
      General[key] = loadedObj[key]
    }
  }

  export function save() {
      localStorage.setItem("settings", JSON.stringify(getvalues()))
  }

  export function change(key: keyof typeof General, newVal: ValueOf<typeof General>) {
    if (typeof General[key] !== undefined && Object.keys(General).indexOf(key.toString()) >= 0) {
      General[key] = newVal
      save()
      refresh()
    }
    else {
      console.log(
        "key not found"
      )
    }
  }
}

window.Setting = Setting;