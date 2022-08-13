/// <reference path="types.d.ts" />
export namespace Setting {
  var refresh = () => {
    // TODO
  };
  
  var _values: GeneralSettings = {
    _3d: true,
    sens: 100,
    ex: 1,
    globe: false,
    copyAndPaste: false,
    borderAdmin: false,
    borders: true,
    drawerOpen: false,
    globeView: true,
    flags: true,
    streamOverlay: true,
    temporaryGuesses: true,
    testing: false,
    streamer: undefined
  }

  var streamerSettings: StreamerSettings = {
    borders: false,
    flags: false,
    streamOverlay: false,
    borderAdmin: false,
    temporaryGuesses: false,
    streamer: undefined
  }

  export function changeStreamerSettings(key: keyof typeof streamerSettings, newVal: ValueOf<typeof streamerSettings>) {
    streamerSettings[key] = newVal
    refresh()
  }

  export function getvalues() {
    const values = structuredClone(_values)

    for (const key of Object.keys(streamerSettings)) {
      if (streamerSettings[key] === false) {
        values[key] = streamerSettings[key]
      }
    }
    return values
  }

  export function initialize() {
    load()
    console.log(_values)
  }

  export function load() {
    let loadedObj = JSON.parse(localStorage.getItem("settings") ?? "{}") ?? {}
    for (const key of Object.keys(loadedObj)) {
    _values[key] = loadedObj[key]
    }
  }

  export function save() {
      localStorage.setItem("settings", JSON.stringify(getvalues()))
  }
  export function change(key: keyof typeof _values, newVal: ValueOf<typeof _values>) {
    if (typeof _values[key] !== undefined && Object.keys(_values).indexOf(key.toString())) {
      _values[key] = newVal
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