/** App settings */
export namespace Setting {

    /** Refresh event handler */
    export var OnRefresh: Nullable<(key: keyof typeof Streamer) => void> = null

    /** Refresh the app depending on setting changes */
    export function FireOnRefresh(key: keyof typeof Streamer)
    {
        if (!key) return;

        Logger.debug(Debug("Refresh received"))

        if (OnRefresh) OnRefresh(key);
        else Logger.warn(Msg(`OnRefresh isn't set! No action for key: ${key}`))
    };

    /** Unique map id streamer GeoChatter client is hosting */
    export var MapId: Nullable<string> = ""

    /** Streamer map settings */
    export var Streamer: StreamerSettings = {
        gameMode: null,
        installedFlagPacks: {},
        borderAdmin: false,
        isUSStreak: false,
        mapIdentifier: "",
        showBorders: false,
        showFlags: false,
        showStreamOverlay: false,
        streamer: "",
        temporaryGuesses: false
    }

    /** Reload given key */
    export function ForceReload(key: keyof StreamerSettings)
    {
        FireOnRefresh(key)
    }

    /** Change settings */
    export function ChangeStreamerSettings(key: keyof StreamerSettings, newVal: ValueOf<StreamerSettings>) 
    {
        try
        {
            var oldVal = Streamer[key];
            if (key == "installedFlagPacks")
            {
                if (!newVal) return;
    
                Streamer[key] = JSON.parse(newVal)
            }
            else
            {
                Streamer[key] = newVal
            }
    
            if (oldVal != Streamer[key])
            {
                FireOnRefresh(key)
            }
        }
        catch(e)
        {
            Logger.error(Msg(e))
        }
    }
}

window.Setting = Setting;