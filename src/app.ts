import { Constant } from "./constants";
import { Enum } from "./enums";
import { Color } from "./colors"
import { Control } from "./controls"
import { Connection } from "./wss"
import * as L from 'leaflet';
import { Setting } from "./settings";
import { Util } from "./utils";

/** Application main namespace */
export namespace App {
    /** Main invoke date */
    export var Invoked: Nullable<Date>;
    /** EndInitialize date */
    export var Initialized: Nullable<Date>;
    /** Twitch ext helper */
    export var TwitchExt = Twitch.ext;

    /** Initialized state */
    export var IsInitialized: boolean = false;
    /** Sending guess allowed state */
    export var CanSendGuess: boolean = false;
    /** Wheter platform is mobile */
    export var IsMobile: boolean = false;

    /** Default tile layer name */
    const DefaultLayerName = "OpenStreetMap";
    /** Currently displayed layer */
    export var CurrentLayer: string = DefaultLayerName;
    /** Currently displayed popup */
    export var CurrentPopup: Nullable<L.Popup>;
    /** Currently displayed marker */
    export var CurrentMarker: Nullable<L.Marker & {_map: L.Map}>;
    /** Last click coordinates */
    export var CurrentGuess: Coordinates = { lat: 0, lng: 0 };

    /** Last error type */
    export var LastError: Enum.FAIL_NAME = Enum.FAIL_NAME.NONE;

    /** Borders */
    export var BorderFeatures: GCFeatureCollection[] = [];
    /** Borders cache */
    var BorderFeaturesCache: GCFeatureCollection[] = [];

    /** Flags */
    export var Flags: SVGDictionary = {};
    /** Flags cache */
    var FlagsCache: SVGDictionary = {};

    /** ISO data */
    export var ISO: ISOData[] = [];

    /** Current geojson layer being displayed */
    export var CurrentGeoJSONLayer: Nullable<L.GeoJSON>;

    /** Currently displayed geojson feature name */
    export var CurrentFeatureName: Nullable<string>;

    /** Currently displayed geojson flag SVG */
    export var CurrentFeatureFlag: Nullable<string>;

    /** GeoJSON styling options */
    export var GeoJSONStyle: L.GeoJSONOptions = {
        style: {
            fillOpacity: 0.1
        }
    };

    /** Helix request headers */
    export var helix = {
        'Client-ID': Constant.CLIENT_ID,
        'Authorization': 'Extension '
    };

    /** User data */
    export var User = {
        id: "",
        login: "",
        display_name: "",
        profile_image_url: ""
    };

    /** Authorization data */
    export var AuthData: Twitch.ext.Authorized = {
        channelId: "",
        clientId: "",
        helixToken: "",
        token: "",
        userId: ""
    };

    /** Map instance */
    export var Map: Nullable<L.Map>;

    /** Marker icon class extended */
    export var LeafIcon = L.Icon.extend({
        options: {
            iconSize: [32, 32],
            iconAnchor: [18, 18],
            popupAnchor: [18, 18]
        }
    }) as unknown as any;

    /** Error messages by type */
    export const FAIL_MESSAGE =
    {
        [Enum.FAIL_NAME.NONE]: "",
        [Enum.FAIL_NAME.UNAUTHORIZED]: "Access not granted!",
        [Enum.FAIL_NAME.SERVER_OFFLINE]: "GeoChatter servers are down! Try again later.",
        [Enum.FAIL_NAME.CHANNEL_OFFLINE]: "No game found with given game code!",
        [Enum.FAIL_NAME.INTERNAL]: "Something went wrong, reload the page."
    }

    /** Hub to connect to */
    export var HubURL: Nullable<string>;

    /** Streamer GeoGuessr ID */
    export var StreamerGeoGuessrID: Nullable<string>;

    /** App version to check for configuration */
    const VERSION = "v100";

    /** Handle twitch configuration */
    function handleConfiguration() {
        if (TwitchExt.configuration.broadcaster) {
            try {
                if (TwitchExt.configuration.broadcaster.version != VERSION) return Logger.error(Msg("Streamer configuration is not set!"));

                var config = JSON.parse(TwitchExt.configuration.broadcaster.content) as BroadcasterConfig;

                Logger.debug(Msg("Configuration event"), Debug(config));

                StreamerGeoGuessrID = config.GGUserID
                switch (config.Environment)
                {
                    case "development":
                        {
                            HubURL = Constant.DEV_HUB;
                            break;
                        }
                    default:
                        {
                            HubURL = Constant.PROD_HUB;
                            break;
                        }
                }

                if (!StreamerGeoGuessrID) {
                    Logger.error(Msg("Streamer GeoGuessr ID is invalid!"))
                }
            }
            catch (e) {
                Logger.warn(Msg(e))
            }
        }
    }

    /** Last received context */
    export var LastContext = {} as Twitch.ext.Context;

    /** Context handler */
    function handleContext(e: Twitch.ext.Context | any) {
        LastContext = e;
    }

    /** Twitch auth handler invoked state */
    export var WasAuthHandlerInvoked: boolean = false;

    /** Handle twitch authorization */
    async function handleAuthorized(e: Twitch.ext.Authorized) {
        Logger.debug(Msg("Authorization event"), Debug(e));

        AuthData = {
            channelId: e.channelId,
            clientId: e.clientId,
            helixToken: e.helixToken,
            token: e.token,
            userId: e.userId,
        };
        await collectHelix();

        WasAuthHandlerInvoked = true;

        await Initialize();
    }

    /** Handle keydown for sending guesses via spacebar */
    // function handleSpacebar(e: KeyboardEvent)
    // {
    //     if (e.code == "Space") handleSendGuess()
    // }

    /** Random guess button click */
    function handleRandomGuess() {
        nextGuessRand = true
        handleSendGuess();
    }

    /** Handle extension reload */
    async function handleReload() {

        if (Control.SettingCard) Control.SettingCard.style.display = "none";

        if (!WasAuthHandlerInvoked) return

        removeEventListeners();

        await Connection.StopConnection();

        BorderFeatures = [];

        Flags = {}

        ISO = []

        Invoked = null;

        Initialized = null;

        IsInitialized = false;

        CanSendGuess = false;

        IsMobile = false;

        CurrentLayer = DefaultLayerName;

        CurrentPopup = null;

        CurrentMarker = null;

        let lats = localStorage.getItem("LastGuessLat") ?? "0";
        let lngs = localStorage.getItem("LastGuessLng") ?? "0";
        CurrentGuess.lat = parseFloat(lats);
        CurrentGuess.lng = parseFloat(lngs);

        nextGuessRand = false;
        nextGuessTemp = false;

        LastError = Enum.FAIL_NAME.NONE;

        await Initialize();

        Setting.ForceReload("showBorders");
        Setting.ForceReload("showFlags");
        Setting.ForceReload("temporaryGuesses");
    }

    /** Handle send guess button click */
    function handleSendGuess() {
        let temp = nextGuessTemp;
        let rand = nextGuessRand;

        nextGuessTemp = false;
        nextGuessRand = false;

        if ((LastError != Enum.FAIL_NAME.NONE)
            || !IsInitialized
            || !CanSendGuess
            || !Control.SendGuessBtn) return;

        if (!temp) guessButtonState(false);

        if (!TwitchExt.viewer.isLinked) {
            Control.SendGuessBtn.textContent = "Can't guess without granting access!"
                + (IsMobile ? "Open extension settings and grant access!" : "Reload the page to get the access prompt.");

            LastError = Enum.FAIL_NAME.UNAUTHORIZED;

            return;
        }

        var send: GuessData =
        {
            bot: `${Setting.MapId}`,
            hlx: "",
            lat: `${CurrentGuess.lat}`,
            lng: `${CurrentGuess.lng}`,
            tkn: `${AuthData.token}`,
            id: `${User.id}`,
            name: `${User.login}`,
            display: `${User.display_name}`,
            pic: `${User.profile_image_url}`,
            isTemporary: temp,
            isRandom: rand,
            sourcePlatform: "Twitch",
            src: "extension"
        };

        sendGuess(send, temp);
    }

    /** Handle click on map instance */
    export function handleMapClick(e: L.LeafletMouseEvent) {
        if (!CurrentMarker || !CurrentPopup || !Map) return;

        CurrentGuess.lat = e.latlng.lat;
        CurrentGuess.lng = e.latlng.lng;
        localStorage.setItem("LastGuessLat", CurrentGuess.lat.toPrecision(8))
        localStorage.setItem("LastGuessLng", CurrentGuess.lng.toPrecision(8))

        if (!CurrentMarker?._map)
        {
            CurrentMarker.addTo(Map);
            enableGuessButton()
        }

        CurrentMarker?.setLatLng(e.latlng);

        if (LastError != Enum.FAIL_NAME.NONE) {
            CurrentPopup
                .setLatLng(e.latlng)
                .setContent(`<p style="font-weight:bold;text-align:center; margin:0 !important;">${FAIL_MESSAGE[LastError]}</p>`)

            CurrentMarker?.openPopup()

            if (Control.SendGuessBtn) Control.SendGuessBtn.textContent = FAIL_MESSAGE[LastError];
        }
        else {
            if (CurrentMarker != null) {
                CurrentMarker?.closePopup()
            }
            else {
                Map.closePopup(CurrentPopup);
                CurrentPopup
                    .setLatLng(e.latlng)
                    .setContent(`<p style="font-weight:bold;text-align:center; margin:0 !important;">Press the button to make a guess</p>`)
                    .openOn(Map);
            }

            if (Setting.Streamer.temporaryGuesses && Control.TempCB?.checked) {
                nextGuessTemp = true;
                handleSendGuess();
            }

            setPolygonsAfterMapClick()
        }
    }

    /** Display polygons on map click */
    async function setPolygonsAfterMapClick() {
        const [country, svg, countryNameResponse] = await Util.GetCountry(Flags,
            BorderFeatures,
            ISO,
            CurrentGuess.lat,
            CurrentGuess.lng
        );

        if (country && "properties" in country) {
            CurrentFeatureName = country?.properties?.shapeName;
        }
        else {
            CurrentFeatureName = countryNameResponse;
        }

        CurrentFeatureFlag = svg;

        if (CurrentGeoJSONLayer) {
            Map?.removeLayer(CurrentGeoJSONLayer);
        }

        if (country && Setting.Streamer.showBorders && Control.BorderCB?.checked && Map) {
            CurrentGeoJSONLayer = L.geoJSON(country, GeoJSONStyle).addTo(Map);
        }

        setFeatureDisplay()
    }

    /** Set top display for country flag and name */
    function setFeatureDisplay() {
        let fcon = document.getElementById("flagContainerImage") as HTMLDivElement;
        if (!Setting.Streamer.showFlags || !Control.FlagCB?.checked) {
            if (fcon) {
                fcon.style.display = "none"
            }
        }
        else if (fcon) {
            fcon.style.display = CurrentFeatureFlag ? "flex" : "none"
            fcon.style.background = `url('${CurrentFeatureFlag ?? ""}')`
        }

        let fname = document.getElementById("featureName");

        if (fname) {
            fname.style.display = CurrentFeatureName ? "flex" : "none"
            fname.textContent = CurrentFeatureName ?? "";
        }
    }

    /** Document click */
    function handleDocumentClick(event: any) {
        if (!Control.SettingCard) return

        if (event.target.matches('#settingsBtn')) {
            // Ignore
        }
        else if (!event.target.matches('#settingCard, #settingCard *')) {
            Control.SettingCard.style.display = "none";
        }

        if (!event.target.matches('.dropbtn')) {
            Control.FlagDropdown?.classList.remove("show");
            Control.LayersDropdown?.classList.remove("show");
        }
    }

    /** Display settings window */
    function handleSettingsClick() {
        if (!Control.SettingCard) return

        if (Control.SettingCard.style.display == "flex")
            Control.SettingCard.style.display = "none";
        else
            Control.SettingCard.style.display = "flex";
    }

    function handleLogDisplay() {
        let t = document.getElementById("infoArea")
        if (!t) return;

        Debug("Last Context")
        Debug(JSON.stringify(LastContext))
        Debug("Auth")
        Debug(JSON.stringify(AuthData))
        Debug("User")
        Debug(JSON.stringify(User))
        Debug("Viewer")
        Debug(JSON.stringify(TwitchExt.viewer))
        Debug("Streamer")
        Debug(StreamerGeoGuessrID)
        t.textContent = Messages.join("\r\n");
    }

    function handleFlagBtn() {
        if (Control.FlagDropdown) $(Control.FlagDropdown).toggleClass("show");
    }

    function handleLayersBtn() {
        if (Control.LayersDropdown) $(Control.LayersDropdown).toggleClass("show");
    }

    /** Add all event listeners to buttons and instances */
    export function addEventListeners() {

        if (!IsMobile) {
            // document.body.addEventListener("keydown", handleSpacebar)
        }

        document.addEventListener("click", handleDocumentClick);

        Control.SendGuessBtn?.addEventListener("click", handleSendGuess);

        Control.SettingBtn?.addEventListener("click", handleSettingsClick);
        Control.FlagCB?.addEventListener("change", () => localStorage.setItem("disableFlagDisplay", Control.FlagCB?.checked ? "0" : "1"));
        Control.BorderCB?.addEventListener("change", () => localStorage.setItem("disableBorders", Control.BorderCB?.checked ? "0" : "1"));
        Control.TempCB?.addEventListener("change", () => localStorage.setItem("disableTempGuesses", Control.TempCB?.checked ? "0" : "1"));

        Control.FlagBtn?.addEventListener("click", handleFlagBtn);
        Control.LayersBtn?.addEventListener("click", handleLayersBtn);

        Control.ReloadBtn?.addEventListener("click", handleReload);
        Control.InfoBtn?.addEventListener("click", handleLogDisplay);

        Control.RandomBtn?.addEventListener("click", handleRandomGuess);

        Control.ColorPicker?.addEventListener("input", handleColorPickerInput);
        Control.ColorPicker?.addEventListener("change", handleColorChange);

        Map?.on('click', handleMapClick);
    }

    function urlFromLayer(lay: Layer)
    {
        switch (lay.provider)
        {
            case "MapBox":
                return `${lay.source}?optimize=true&access_token=${lay.access_token}`
            case "OSM":
            default:
                return `${lay.source}`
        }
    }

    /** Add layer switch button to dropdown */
    function addButtonForLayer(name: string, lay: Layer)
    {
        let n = name;
        let l = lay;
        let b = $("<button>")
            .addClass("dropbtn")
            .attr("data-tooltip", name)
            .text(name)
            .on("click", () => {
                let _lay = Connection.ExtensionService.Layers[CurrentLayer]?.LeafletLayer;
                if (!_lay || CurrentLayer == n || !Map) return;

                Map.removeLayer(_lay);
                CurrentLayer = n;
                l.LeafletLayer?.addTo(Map);
                localStorage.setItem("mapLayerv100", CurrentLayer);
            });

        if (Control.LayersDropdown) $(Control.LayersDropdown).append(b)
    } 
    /** Remove all event listeners to buttons and instances */
    export function removeEventListeners() {

        Setting.OnRefresh = null;
        
        if (!IsMobile) {
            // document.body.removeEventListener("keydown", handleSpacebar)
        }

        document.removeEventListener("click", handleDocumentClick);

        Control.SendGuessBtn?.removeEventListener("click", handleSendGuess);

        Control.SettingBtn?.removeEventListener("click", handleSettingsClick);
        Control.FlagCB?.replaceWith(Control.FlagCB?.cloneNode(true));
        Control.BorderCB?.replaceWith(Control.BorderCB?.cloneNode(true));
        Control.TempCB?.replaceWith(Control.TempCB?.cloneNode(true));

        Control.FlagBtn?.removeEventListener("click", handleFlagBtn);
        Control.LayersBtn?.removeEventListener("click", handleLayersBtn);

        Control.ReloadBtn?.removeEventListener("click", handleReload);
        Control.InfoBtn?.removeEventListener("click", handleLogDisplay);

        Control.ColorPicker?.removeEventListener("input", handleColorPickerInput)
        Control.ColorPicker?.removeEventListener("change", handleColorChange)

        Map?.removeEventListener('click', handleMapClick);
    }

    /** Enable/Disable send guess button */
    export function guessButtonState(state = false) {
        if (!Control.SendGuessBtn || !Control.RandomBtn) return;

        if (state) {
            CanSendGuess = true;
            Control.SendGuessBtn.style.backgroundColor = "#19770be3";
            Control.SendGuessBtn.style.cursor = "pointer";
            Control.RandomBtn.style.display = "block";
            LastError = Enum.FAIL_NAME.NONE
        }
        else {
            CanSendGuess = false;
            Control.SendGuessBtn.style.backgroundColor = "#6b6b6bd6";
            Control.SendGuessBtn.style.cursor = "default";
            Control.RandomBtn.style.display = "none";
        }
    }

    /** Wheter twitch helper event listeners are added */
    var TwitchEventListenersAdded = false;

    /** Wheter next guess will be a temporary guess */
    var nextGuessTemp = false;

    /** Wheter next guess will be a random guess */
    var nextGuessRand = false;

    /** Get user data from Helix API */
    export async function collectHelix() {

        var id = TwitchExt.viewer.id ?? AuthData.userId;
        var hlx = AuthData.helixToken ?? TwitchExt.viewer.helixToken;
        Debug(`COLLECT HELIX: ${id}, ${hlx}`)
        if (!hlx || !id) return;

        helix['Authorization'] = 'Extension ' + hlx

        let r = await fetch(
            'https://api.twitch.tv/helix/users/?id=' + id,
            {
                method: 'GET',
                headers: helix,
            }
        )
            .catch(err => {
                Logger.error(Msg(err));
                return null;
            })

        if (r && r.status == 200) {
            let js = await r.json()
            Debug("collectHelix response json")
            Debug(js)
            User = js.data[0];
        }
        else {
            Debug("collectHelix response status")
            Debug(r?.status)
        }
    }

    /** Set error by type and display on screen */
    export function setError(name: FAIL_NAME, message?: string) {
        if (message && message.indexOf && message.indexOf("<!DOCTYPE html>") >= 0) {
            fatalError("Something went wrong. Try reloading the page.")
            Debug("Error message HTML base64: " + btoa(message));
            return;
        }

        LastError = name;
        let err = (FAIL_MESSAGE[LastError] ? `${FAIL_MESSAGE[LastError]}. ` : "");

        if (err) Logger.error(Msg(name), Msg(err), Msg(message));

        if (Control.SendGuessBtn) Control.SendGuessBtn.textContent = `${err}${(message ? message : "")}`
    }

    /** Send guess via wss */
    function sendGuess(data: GuessData, wasTemp: boolean) {
        if (LastError != Enum.FAIL_NAME.NONE) return

        if (data && data.isTemporary) {
            Logger.info(Msg(`Sent a temporary guess...`))
        }
        else {
            Logger.info(Msg("Sent a guess, waiting for confirmation..."))
        }

        Connection.SendGuess(data)
            .then(res => {
                Logger.log(Debug(res));
                if (res[1] < 0) {
                    Logger.info(Msg("Failed to send the guess"))
                    setError(Enum.FAIL_NAME.SERVER_OFFLINE)
                }
                else if (!wasTemp) {
                    watchAndReportGuessState(res[1])
                }
            })
            .catch(() => setError(Enum.FAIL_NAME.INTERNAL))
    }

    async function fatalError(text: string, killconnection = true) {
        Logger.error("Fatal Error", Debug(text));
        setError(Enum.FAIL_NAME.INTERNAL, Msg(text));

        if (killconnection) await Connection.StopConnection();
    }

    /** Determine what to do upon received guess state, return wheter to exit guess state checker */
    async function determineGuessStatus(status: GuessState): Promise<boolean>    {
        switch (status) {
            case Enum.GuessState.Submitted:
                {
                    setError(Enum.FAIL_NAME.NONE, Msg("Waiting for guess confirmation..."));
                    return false;
                }
            case Enum.GuessState.Banned:
                {
                    await fatalError("You are banned by the streamer and not allowed participate in any games.");
                    break;
                }
            case Enum.GuessState.BotNotFound:
                {
                    setError(Enum.FAIL_NAME.NONE, Msg("No game found for: " + (Setting.MapId ? Setting.MapId : StreamerGeoGuessrID)));
                    setTimeout(enableGuessButton, 3000);
                    break;
                }
            case Enum.GuessState.GuessedAlready:
                {
                    setError(Enum.FAIL_NAME.NONE, Msg("Already sent a guess for the round!"));
                    setTimeout(enableGuessButton, 2500);
                    break;
                }
            case Enum.GuessState.InvalidCoordinates:
                {
                    await fatalError("Invalid coordinates. Refresh the page.");
                    break;
                }
            case Enum.GuessState.NoGame:
                {
                    setError(Enum.FAIL_NAME.NONE, Msg("No ongoing game found, try again later."));
                    setTimeout(enableGuessButton, 5000);
                    break;
                }
            case Enum.GuessState.NotFound:
                {
                    await fatalError("Invalid user data. Refresh the page.");
                    break;
                }
            case Enum.GuessState.SameCoordinates:
                {
                    setError(Enum.FAIL_NAME.NONE, Msg("Failed to send same guess back to back."));
                    setTimeout(enableGuessButton, 2500);
                    break;
                }
            case Enum.GuessState.Success:
                {
                    setError(Enum.FAIL_NAME.NONE, Msg("Guess Registered Successfully!"));
                    if (CurrentMarker?._map && Map)
                    {
                        CurrentMarker?.removeFrom(Map);
                    }
                    break;
                }
            case Enum.GuessState.TempSuccess:
                {
                    // TODO
                    break;
                }
            case Enum.GuessState.TooFast:
                {
                    setError(Enum.FAIL_NAME.NONE, Msg("Sending guesses too fast, try guessing again."));
                    setTimeout(enableGuessButton, 2500);
                    break;
                }
            case Enum.GuessState.UndefinedError:
                {
                    setError(Enum.FAIL_NAME.INTERNAL, Msg("Server error. Try guessing again."));
                    setTimeout(enableGuessButton, 2500);
                    break;
                }
            case Enum.GuessState.Unknown:
                {
                    await fatalError("Invalid guess id. Refresh the page.");
                    break;
                }
            default:
                {
                    setError(Enum.FAIL_NAME.INTERNAL, Msg("Something went wrong. Try guessing again."));
                    setTimeout(enableGuessButton, 2500);
                    break;
                }
        }
        return true;
    }

    function handleGuessFailedToRegister() {
        setError(Enum.FAIL_NAME.INTERNAL, "Check the stream to confirm your guess and try again.");
        setTimeout(enableGuessButton, 5000);
    }

    async function watchAndReportGuessState(guessid: number) {
        const interval = 500;
        const tries = 6;
        var i = 0;
        var status = Enum.GuessState.Submitted;

        while (i++ < tries) {
            await new Promise((res) => setTimeout(res, interval));
            status = await Connection.GetGuessState(guessid)
            Logger.log(Msg(`Guess(${guessid}) status: ${status}`));
            if (await determineGuessStatus(status)) return;
        }

        handleGuessFailedToRegister()
    }

    /** Enable guess button */
    export function enableGuessButton() {
        if (!Control.SendGuessBtn) return

        Control.SendGuessBtn.textContent = `Guess`;
        guessButtonState(true);
    }

    /** Cache user data locally */
    function handleLocalStorage() {
        if (!User.profile_image_url) User.profile_image_url = localStorage.getItem("user_profile_image_url") ?? "";
        if (!User.id) User.id = localStorage.getItem("user_id") ?? "";
        if (!User.login) User.login = localStorage.getItem("user_login") ?? "";
        if (!User.display_name) User.display_name = localStorage.getItem("user_display_name") ?? "";

        if (User.profile_image_url) localStorage.setItem("user_profile_image_url", User.profile_image_url);
        if (User.id) localStorage.setItem("user_id", User.id);
        if (User.login) localStorage.setItem("user_login", User.login);
        if (User.display_name) localStorage.setItem("user_display_name", User.display_name);

        let lats = localStorage.getItem("LastGuessLat") ?? "0";
        let lngs = localStorage.getItem("LastGuessLng") ?? "0";
        CurrentGuess.lat = parseFloat(lats);
        CurrentGuess.lng = parseFloat(lngs);
    }

    function handleColorChange() {
        if (!Control.ColorPicker) return;

        var color = $(Control.ColorPicker).val() as string

        if (!color) return;

        var send: ColorData =
        {
            bot: `${Setting.MapId}`,
            hlx: "",
            tkn: `${AuthData.token}`,
            id: `${User.id}`,
            name: `${User.login}`,
            display: `${User.display_name}`,
            pic: `${User.profile_image_url}`,
            sourcePlatform: "Twitch",
            src: "extension",
            color: color
        };

        if (checkAndSetTimeoutForMessage("Color")) {
            Logger.info(Msg(`Set username color to: ${color}`))

            Connection.SendColor(send);
        }
    }

    var colorPickerTimerId: Nullable<number>;

    function handleColorPickerInput() {
        if (!Control.ColorPicker) return;

        let cp = $(Control.ColorPicker);
        if (colorPickerTimerId) {
            clearTimeout(colorPickerTimerId);
        }
        colorPickerTimerId = setTimeout(function () {
            if (Control.ColorBtn) {
                let el = $(Control.ColorBtn);
                let clr = cp.val() as string;

                el.css('background-color', clr);

                let mstyler = document.querySelector(':root') as HTMLStyleElement;
                mstyler?.style.setProperty('--usermarkerborder', clr);

                if (Color.ShouldUseDark(clr)) {
                    if (!el.hasClass("colorBtn-dark")) el.addClass("colorBtn-dark")
                }
                else {
                    el.removeClass("colorBtn-dark");
                }
            }
        }, 50);
    }
    
    /** Set button and control instances */
    function setControls() {

        Control.ColorBtn = document.getElementById("colorBtn");
        Control.ColorPicker = document.getElementById("colorPicker");
        Control.FlagBtn = document.getElementById("flagsBtn");
        Control.FlagDropdown = document.getElementById("flagDropdown");
        Control.LayersBtn = document.getElementById("layersBtn");
        Control.LayersDropdown = document.getElementById("layers");

        Control.SettingBtn = document.getElementById("settingsBtn");
        Control.SettingCard = document.getElementById("settingCard");
        Control.FlagCB = document.getElementById("FlagCB") as HTMLInputElement;
        Control.BorderCB = document.getElementById("BorderCB") as HTMLInputElement;
        Control.TempCB = document.getElementById("TempCB") as HTMLInputElement;

        if (Control.FlagCB) Control.FlagCB.checked = localStorage.getItem("disableFlagDisplay") != "1"
        if (Control.BorderCB) Control.BorderCB.checked = localStorage.getItem("disableBorders") != "1"
        if (Control.TempCB) Control.TempCB.checked = localStorage.getItem("disableTempGuesses") != "1"

        Control.ReloadBtn = document.getElementById("reloadBtn");

        Control.InfoBtn = document.getElementById("infoBtn");

        Control.RandomBtn = document.getElementById("randomBtn");
        Control.SendGuessBtn = document.getElementById("guessBtn");
    }

    /** Set the map instance */
    function setMap() {
        Map?.remove();

        let curr = Connection.ExtensionService.Layers[CurrentLayer];
        if (!curr) 
        {
            CurrentLayer = DefaultLayerName;
            curr = Connection.ExtensionService.Layers[CurrentLayer];
            if (!curr) 
            {
                return
            }
        }

        Map = L.map('map', curr.options);

        Map.setView(curr.center, curr.min_zoom);
        Map.attributionControl.addAttribution(curr.attributions);

        curr.LeafletLayer?.addTo(Map);

        localStorage.setItem("mapLayerv100", CurrentLayer);
    }

    /** Marker click handle */
    function handleMarkerClick(event: any) {
        event.target.closePopup()
        handleMapClick(event);
    }

    /** Post Twitch auth main initializing */
    async function EndInitialize() {
        CurrentPopup = L.popup(
            {
                closeOnClick: true,
                closeButton: false,
                zoomAnimation: true
            })
            .setContent('<b>Click somewhere and make a guess!</b>');

        await collectHelix();

        if (!TwitchExt.viewer.isLinked) {
            TwitchExt.actions.requestIdShare();
            await collectHelix();
        }

        handleLocalStorage();

        if (!StreamerGeoGuessrID)
        {
            let m = "Streamer configuration is missing their GeoGuessr ID!";
            setError(Enum.FAIL_NAME.NONE, m);
            Logger.error(Msg(m));
            return;
        }

        if (!HubURL)
        {
            let m = "Streamer configuration is missing GeoChatter extension environment setup!";
            setError(Enum.FAIL_NAME.NONE, m);
            Logger.error(Msg(m));
            return;
        }
        Setting.OnRefresh = RefreshViewBySetting;

        await Connection.BeginConnection(HubURL)

        let res = await Connection.StartConnection(StreamerGeoGuessrID)
            .catch(err => {
                Logger.error(Msg(err));
                return {
                    msg: (err as string)?.toString(),
                    state: Enum.CONNECTIONSTART_STATE.ERROR
                };
            })

        if (res.state == Enum.CONNECTIONSTART_STATE.STARTED) {
            Logger.info(Msg("Established connection, finalizing initializer."), Debug(res));
            
            setLayers();

            ISO = await Util.GetISOData();
            
            setMap();

            if (!Map)
            {
                let m = "Failed to initalize the map, reload the page.";
                setError(Enum.FAIL_NAME.NONE, m);
                Logger.error(Msg(m));
                await Connection.StopConnection();
                return
            }
    
            addEventListeners();

            if (User.profile_image_url) {
                var avatar = new LeafIcon({
                    iconUrl: User.profile_image_url,
                })

                let lats = localStorage.getItem("LastGuessLat") ?? "0";
                let lngs = localStorage.getItem("LastGuessLng") ?? "0";
                let lts = parseFloat(lats);
                let lns = parseFloat(lngs)
                localStorage.setItem("LastGuessLat", lts.toPrecision(8))
                localStorage.setItem("LastGuessLng", lns.toPrecision(8))
                
                let markerpos = {lat: lts, lng: lns};

                CurrentMarker = new L.Marker(markerpos, { icon: avatar, bubblingMouseEvents: true }).addTo(Map) as typeof CurrentMarker;

                CurrentPopup.options.offset = [-18, -18]

                CurrentMarker?.bindPopup(CurrentPopup)
                    .on('click', handleMarkerClick);

                setTimeout(() => {
                    CurrentMarker?.openPopup();
                    Map?.flyTo(markerpos, 10, { duration: 3 });
                }, 500);
            }
            else {
                CurrentPopup
                    .setLatLng(Connection.ExtensionService.Layers[CurrentLayer]?.center ?? [0, 0])
                    .addTo(Map)
                    .on('click', handleMarkerClick);
            }
            enableGuessButton();

            IsInitialized = true;
            Initialized = new Date();
        }
        else if (res.state == Enum.CONNECTIONSTART_STATE.ERROR) {
            setError(Enum.FAIL_NAME.NONE, res.msg);
            Logger.error(Msg(res));
            await Connection.StopConnection();
        }
    }

    function setLayers()
    {
        if (Control.LayersDropdown) $(Control.LayersDropdown).empty();

        for(let [name, data] of Object.entries(Connection.ExtensionService.Layers))
        {
            Logger.debug(Debug("Adding button for layer..."), Debug(name), Debug(data))

            let leaf = null;

            switch (data.provider)
            {
                case "OSM":
                case "MapBox":
                    {
                        leaf = L.tileLayer(urlFromLayer(data), {
                            attribution: data.attributions,
                            maxZoom: data.max_zoom,
                            minZoom: data.min_zoom,
                            tileSize: data.tile_size,
                            zoomOffset: data.zoom_offset
                        });
                        data.LeafletLayer = leaf;
                        addButtonForLayer(name, data);
                        break;
                    }
                default: 
                    break;
            }
        }
    }

    /** Refresh the overlays and the view by streamer settings changing */
    async function RefreshViewBySetting(key: keyof typeof Setting.Streamer) {
        switch (key) {
            case "showBorders":
                {
                    if (Setting.Streamer.showBorders) {
                        if (BorderFeatures.length == 0) {
                            if (BorderFeaturesCache.length == 0) {
                                BorderFeatures = await Util.GetFeatures()
                                if (BorderFeatures.length > 0) BorderFeaturesCache = BorderFeatures;
                            }
                            else {
                                BorderFeatures = BorderFeaturesCache
                            }
                        }
                    }
                    else {
                        if (BorderFeatures.length > 0) BorderFeaturesCache = BorderFeatures;
                        BorderFeatures = [];
                    }
                    Logger.info(Msg(`New streamer setting: Borders are ${(Setting.Streamer.showBorders ? "enabled" : "disabled")}`))
                    break;
                }
            case "showFlags":
                {
                    if (Setting.Streamer.showFlags) {
                        if (Object.entries(Flags).length == 0) {
                            if (Object.entries(FlagsCache).length == 0) {
                                Flags = await Util.GetFlags()
                                if (Object.entries(Flags).length >= 0) FlagsCache = Flags;
                            }
                            else {
                                Flags = FlagsCache
                            }
                        }
                    }
                    else {
                        if (Object.entries(Flags).length >= 0) FlagsCache = Flags;
                        Flags = {};
                    }

                    setFlagsDropdown();

                    Logger.info(Msg(`New streamer setting: Flags are ${(Setting.Streamer.showFlags ? "enabled" : "disabled")}`))
                    break;
                }
            default:
                {
                    Logger.debug(Debug("Unhandled streamer setting"), Debug(key), Debug(Setting.Streamer[key]));
                    break;
                }
        }
    }

    var settingFlags = false;

    async function setFlagsDropdown() {
        try {
            if (Control.FlagDropdown) $(Control.FlagDropdown).empty()

            let svgshow = Setting.Streamer.showFlags;

            while (settingFlags) {
                await new Promise((res) => setTimeout(res, 500));
            }
            settingFlags = true;

            if (Control.FlagDropdown) {
                let anc = $("<a>");
                anc
                    .append($("<div>"))
                    .append($("<span>").text("Random Flag"))
                    .data("flagcode", "random");
                Control.FlagDropdown.appendChild(anc[0] as HTMLElement)

                anc.on("click", handleFlagSelect)
                for (let [code, svg] of Object.entries(FlagsCache)) {
                    if (!code || !svg) continue

                    let anc = $("<a>");
                    anc
                        .append($("<div>").css("background-image", `${svgshow ? `url('${svg}')` : ""}`))
                        .append($("<span>").text(code))
                        .data("flagcode", code);
                    Control.FlagDropdown.appendChild(anc[0] as HTMLElement)

                    anc.on("click", handleFlagSelect)
                }
            }
        }
        catch (e) {
            Logger.error(Debug("Failed to set flags dropdown"), Debug(e));
        }
        finally {
            settingFlags = false;
        }
    }
    var CommandTimeouts = {
        Color: {
            isCurrentlyAllowed: true,
            timeout: 5000
        },
        Flag: {
            isCurrentlyAllowed: true,
            timeout: 5000
        }
    }

    function checkAndSetTimeoutForMessage(cmd: keyof typeof CommandTimeouts): boolean {
        if (!CommandTimeouts[cmd].isCurrentlyAllowed) return false;

        CommandTimeouts[cmd].isCurrentlyAllowed = false;
        setTimeout(() => CommandTimeouts[cmd].isCurrentlyAllowed = true, CommandTimeouts.Flag.timeout)
        return true;
    }

    function handleFlagSelect(ev: JQuery.ClickEvent) {
        var flag = $(ev.currentTarget).data("flagcode") as string

        if (!flag) return;

        var send: FlagData =
        {
            bot: `${Setting.MapId}`,
            hlx: "",
            tkn: `${AuthData.token}`,
            id: `${User.id}`,
            name: `${User.login}`,
            display: `${User.display_name}`,
            pic: `${User.profile_image_url}`,
            sourcePlatform: "Twitch",
            src: "extension",
            flag: flag
        };

        handleFlagBtn();

        if (checkAndSetTimeoutForMessage("Flag")) {
            Logger.info(Msg(`Set flag to: ${flag}`))

            Connection.SendFlag(send);
        }
    }

    async function Initialize() {
        await BeginInitialize()
            .catch(err => {
                Logger.error(Msg(err));
            });

        setFlagsDropdown();

        await EndInitialize()
    }

    /** Begin initializing process */
    async function BeginInitialize() {
        try {
            setControls();

            guessButtonState(false);

            CurrentLayer = localStorage.getItem("mapLayerv100") ?? DefaultLayerName;

            while (!WasAuthHandlerInvoked) {
                Logger.debug("Waiting for Twitch auth handler...");
                await new Promise((res) => setTimeout(res, 500));
            }
        }
        catch (e) {
            Logger.error(Msg("Error, please reload the page. " + e))
        }
    }

    /** Main entry point */
    export async function Main() {
        Invoked = new Date();
        Logger.info(Msg("Main invoked"), Debug(Invoked))

        TwitchExt = window.Twitch.ext;
        IsMobile = new URLSearchParams(window.location.search).get('platform') == "mobile"

        if (!TwitchEventListenersAdded) {
            TwitchEventListenersAdded = true;

            TwitchExt.onAuthorized(handleAuthorized);

            TwitchExt.onContext(handleContext);

            TwitchExt.configuration.onChanged(handleConfiguration);
        }
    }
}

window.App = App;