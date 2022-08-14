import { Constant, Enum } from "./core"
import { Control } from "./controls"
import { Connection } from "./wss"
import * as L from 'leaflet';
import { Setting } from "./settings";

/** Application main namespace */
export namespace App
{
    /** Main invoke date */
    export var Invoked: Date;
    /** EndInitialize date */
    export var Initialized: Date;
    /** Twitch ext helper */
    export var TwitchExt = Twitch.ext;

    /** Initialized state */
    export var IsInitialized: boolean = false;
    /** Sending guess allowed state */
    export var CanSendGuess: boolean = false;
    /** Wheter platform is mobile */
    export var IsMobile: boolean = false;

    /** Currently displayed layer */
    export var CurrentLayer: LAYER = Enum.LAYER.STREETS;
    /** Currently displayed popup */
    export var CurrentPopup: L.Popup;
    /** Currently displayed marker */
    export var CurrentMarker: L.Marker;
    /** Last click coordinates */
    export var CurrentGuess: Coordinates = {lat: 0, lng: 0, randomize: false};
    
    /** Last error type */
    export var LastError: Enum.FAIL_NAME = Enum.FAIL_NAME.NONE;
    
    /** Available layers */
    export const Layers = 
    {
        [Enum.LAYER.STREETS]: L.tileLayer(Constant.DEFAULT_LAYER + Constant.ACCESS_TOKEN, {
            attribution: Constant.ATTRIBUTIONS,
            maxZoom: Constant.MAX_ZOOM,
            minZoom: Constant.MIN_ZOOM,
            tileSize: 512,
            zoomOffset: -1
        }),
        [Enum.LAYER.SATELLITE]: L.tileLayer(Constant.DEFAULT_SAT_LAYER + Constant.ACCESS_TOKEN,{
            attribution: Constant.ATTRIBUTIONS,
            maxZoom: Constant.MAX_ZOOM,
            minZoom: Constant.MIN_ZOOM,
            tileSize: 512,
            zoomOffset: -1
        })
    }

    /** Streamer channel name */
    export var StreamerName = "";

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
    export var Map: L.Map;

    /** Marker icon class extended */
    export var LeafIcon = L.Icon.extend({
        options: {
            iconSize:     [32, 32],
            iconAnchor:   [19, 19],
            popupAnchor:  [19, 19]
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

    /** Handle twitch configuration */
    function handleConfiguration()
    {
        if (TwitchExt.configuration.broadcaster) {
            try 
            {
                var config = JSON.parse(TwitchExt.configuration.broadcaster.content);
                console.debug(config);
            } 
            catch (e)
            {
                console.warn(e)
            }
        }
    }

    function handleContext(e: Twitch.ext.Context | any)
    {
        console.debug(e);
    }

    /** Handle twitch authorization */
    async function handleAuthorized(e: Twitch.ext.Authorized)
    {
        console.debug(e);

        AuthData = {
            channelId: e.channelId,
            clientId: e.clientId,
            helixToken: e.helixToken,
            token: e.token,
            userId: e.userId,
        };
        await collectHelix();
        if (!StreamerName) StreamerName = await getChannelName()
    }

    /** Handle keydown for sending guesses via spacebar */
    function handleSpacebar(e: KeyboardEvent)
    {
        if (e.code == "Space") handleSendGuess()
    }

    /** Random guess button click */
    function handleRandomGuess()
    {
        nextGuessRand = true
        handleSendGuess();
    }

    /** Wheter twitch helper event listeners are added */
    var TwitchEventListenersAdded = false;

    /** Add all event listeners to buttons and instances */
    export function addEventListeners()
    {
        if (!IsMobile){
            document.body.addEventListener("keydown", handleSpacebar)
        }

        if (!TwitchEventListenersAdded)
        {
            TwitchEventListenersAdded = true;
            TwitchExt.configuration.onChanged(handleConfiguration);
            
            TwitchExt.onAuthorized(handleAuthorized);

            TwitchExt.onContext(handleContext);
        }
        
        Control.SendGuessBtn?.addEventListener("click", handleSendGuess);

        Control.ReloadBtn?.addEventListener("click", handleReload);

        Control.RandomBtn?.addEventListener("click", handleRandomGuess);

        Control.SatelliteLayerBtn?.addEventListener("click", layerChangers[Enum.LAYER.SATELLITE]);
        
        Control.StreetsLayerBtn?.addEventListener("click", layerChangers[Enum.LAYER.STREETS]);
        
        Map.on('click', handleMapClick);
    }

    /** Layer change callback creator */
    function layerChangerFunction(layer: LAYER)
    {
        let _layer = layer;
        return () =>{
            Map.removeLayer(Layers[CurrentLayer]);
            CurrentLayer = _layer;
            Layers[CurrentLayer].addTo(Map);
        }
    }

    /** Layer change callbacks */
    var layerChangers = {
        [Enum.LAYER.SATELLITE]: layerChangerFunction(Enum.LAYER.SATELLITE),
        [Enum.LAYER.STREETS]: layerChangerFunction(Enum.LAYER.STREETS),
    }

    /** Remove all event listeners to buttons and instances */
    export function removeEventListeners()
    {
        if (!IsMobile){
            document.body.removeEventListener("keydown", handleSpacebar)
        }

        Control.SendGuessBtn?.removeEventListener("click", handleSendGuess);

        Control.ReloadBtn?.removeEventListener("click", handleReload);

        Control.SatelliteLayerBtn?.removeEventListener("click", layerChangers[Enum.LAYER.SATELLITE]);
        
        Control.StreetsLayerBtn?.removeEventListener("click", layerChangers[Enum.LAYER.STREETS]);
        
        Map.removeEventListener('click', handleMapClick);
    }

    /** Enable/Disable send guess button */
    export function guessButtonState(state = false)
    {
        if (!Control.SendGuessBtn || !Control.RandomBtn) return;

        if(state)
        {
            CanSendGuess = true;
            Control.SendGuessBtn.style.backgroundColor = "#19770be3";
            Control.SendGuessBtn.style.cursor = "pointer";
            Control.RandomBtn.style.display = "block";
            LastError = Enum.FAIL_NAME.NONE
        }
        else
        {
            CanSendGuess = false;
            Control.SendGuessBtn.style.backgroundColor = "#6b6b6bd6";
            Control.SendGuessBtn.style.cursor = "default";
            Control.RandomBtn.style.display = "none";
        }
    }

    /** Handle extension reload */
    async function handleReload()
    {
        removeEventListeners();
        await Connection.killConnection();

        Main();
    }

    var nextGuessTemp = false;
    var nextGuessRand = false;

    /** Handle send guess button click */
    function handleSendGuess(){
        let temp = nextGuessTemp;
        let rand = nextGuessRand;

        nextGuessTemp = false;
        nextGuessRand = false;

        if ((LastError != Enum.FAIL_NAME.NONE) || !IsInitialized || !CanSendGuess || !Control.SendGuessBtn) return;

        if (!temp) guessButtonState(false);

        if (!TwitchExt.viewer.isLinked) 
        {
            Control.SendGuessBtn.textContent = "Can't guess without granting access!"
                + (IsMobile ? "Open extension settings and grant access!" : "Reload the page to get the access prompt.");

            LastError = Enum.FAIL_NAME.UNAUTHORIZED;

            return;
        }

        var send: GuessData & {[k: string]: any} = 
        {
            bot: `${Setting.MapId}`,
            lat: `${CurrentGuess.lat}`,
            lng: `${CurrentGuess.lng}`,
            hlx: `${(AuthData.helixToken ? AuthData.helixToken : "")}`,
            tkn: `${AuthData.token}`,
            id: `${User.id ? User.id : TwitchExt.viewer.id}`,
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

    /** Get user data from Helix API */
    async function getChannelName() {
        
        var id = AuthData.channelId;
        var hlx = IsMobile ? AuthData.helixToken : TwitchExt.viewer.helixToken;
        if (!hlx || !id) return;

        helix['Authorization'] = 'Extension ' + hlx

        return await fetch(
                'https://api.twitch.tv/helix/users/?id=' + id,
                {
                    method: 'GET',
                    headers: helix,
                }
            )
            .then(resp => {
                return resp.json();
            })
            .then(resp => resp.data[0].login)
            .catch(err => {
                console.error(err);
            });
    }

    /** Get user data from Helix API */
    export async function collectHelix() {
        
        var id = TwitchExt.viewer.id;
        var hlx = IsMobile ? AuthData.helixToken : TwitchExt.viewer.helixToken;
        if (!hlx || !id) return;

        helix['Authorization'] = 'Extension ' + hlx

        await fetch(
            'https://api.twitch.tv/helix/users/?id=' + id,
            {
                method: 'GET',
                headers: helix,
            }
        )
        .then(resp => {
            return resp.json();
        })
        .then(resp => {
            User = resp.data[0];
        })
        .catch(err => {
            console.error(err);
        });
    }

    /** Handle click on map instance */
    export function handleMapClick(e: L.LeafletMouseEvent) {
        IsInitialized = true;

        if(CurrentPopup == null) return;

        CurrentGuess.lat = e.latlng.lat;
        CurrentGuess.lng = e.latlng.lng;

        CurrentMarker?.setLatLng(e.latlng);

        if (LastError != Enum.FAIL_NAME.NONE)
        {
            CurrentPopup
                .setLatLng(e.latlng)
                .setContent(`<p style="font-weight:bold;text-align:center; margin:0 !important;">${FAIL_MESSAGE[LastError]}</p>`) 
                .openOn(Map);

            if (Control.SendGuessBtn) Control.SendGuessBtn.textContent = FAIL_MESSAGE[LastError];
        }
        else
        {
            if (CurrentMarker != null)
            {
                Map.closePopup()
            }
            else{
                CurrentPopup
                    .setLatLng(e.latlng)
                    .setContent(`<p style="font-weight:bold;text-align:center; margin:0 !important;">Press the button to make a guess</p>`) 
                    .openOn(Map);
            }
            
            if (Setting.Streamer.temporaryGuesses)
            {
                nextGuessTemp = true;
                handleSendGuess();
            }
        }
    }

    /** Set error by type and display on screen */
    export function setError(name: FAIL_NAME, message?: string)
    {
        LastError = name;
        let err = (FAIL_MESSAGE[LastError] ? `${FAIL_MESSAGE[LastError]}. ` : "");

        if (err) console.error(name, err, message);

        if (Control.SendGuessBtn) Control.SendGuessBtn.textContent = `${err}${(message ? message : "")}`
    }

    /** Send guess via wss */
    function sendGuess(data: GuessData, wasTemp: boolean)
    {
        if (LastError != Enum.FAIL_NAME.NONE) return

        Connection.sendGuess(data)
            .then(res =>
            {
                console.log(res);
                if (res[1] < 0)
                {
                    setError(Enum.FAIL_NAME.SERVER_OFFLINE)
                }
                else if(!wasTemp){
                    watchAndReportGuessState(res[1])
                }
            })
            .catch(() => setError(Enum.FAIL_NAME.INTERNAL))
    }

    function overwriteBody(text: string, killconnection = true)
    {
        console.log("Overwriting body", text);
        var b = document.createElement("body")
        b.textContent = text
        b.style.fontSize = "1.5rem";
        b.style.fontWeight = "bolder"
        document.body = b;

        if (killconnection) Connection.killConnection();
    }

    /** Determine what to do upon recieved guess state, return wheter to exit guess state checker */
    function determineGuessStatus(status: GuessState): boolean
    {
        switch (status)
        {
            case Enum.GuessState.Submitted:
                {
                    setError(Enum.FAIL_NAME.NONE, "Waiting for guess confirmation...");
                    return false;
                }
            case Enum.GuessState.Banned:
                {
                    overwriteBody("You are banned by the streamer and not allowed participate in any games.");
                    break;
                }
            case Enum.GuessState.BotNotFound:
                {
                    setError(Enum.FAIL_NAME.NONE, "No game found for: " + Setting.MapId);
                    setTimeout(enableGuessButton, 3000);
                    break;
                }
            case Enum.GuessState.GuessedAlready:
                {
                    setError(Enum.FAIL_NAME.NONE, "Already sent a guess for the round!");
                    setTimeout(enableGuessButton, 2500);
                    break;
                }
            case Enum.GuessState.InvalidCoordinates:
                {
                    overwriteBody("Invalid coordinates. Refresh the page.");
                    break;
                }
            case Enum.GuessState.NoGame:
                {
                    setError(Enum.FAIL_NAME.NONE, "No ongoing game found, try again later.");
                    setTimeout(enableGuessButton, 5000);
                    break;
                }
            case Enum.GuessState.NotFound:
                {
                    overwriteBody("Invalid user data. Refresh the page.");
                    break;
                }
            case Enum.GuessState.SameCoordinates:
                {
                    setError(Enum.FAIL_NAME.NONE, "Failed to send same guess back to back.");
                    setTimeout(enableGuessButton, 2500);
                    break;
                }
            case Enum.GuessState.Success:
                {
                    setError(Enum.FAIL_NAME.NONE, "Guess Registered Successfully!");
                    setTimeout(enableGuessButton, 2500);
                    break;
                }
            case Enum.GuessState.TempSuccess:
                {
                    // TODO
                    break;
                }
            case Enum.GuessState.TooFast:
                {
                    setError(Enum.FAIL_NAME.NONE, "Sending guesses too fast, try guessing again.");
                    setTimeout(enableGuessButton, 2500);
                    break;
                }
            case Enum.GuessState.UndefinedError:
                {
                    setError(Enum.FAIL_NAME.INTERNAL, "Server error. Try guessing again.");
                    setTimeout(enableGuessButton, 2500);
                    break;
                }
            case Enum.GuessState.Unknown:
                {
                    overwriteBody("Invalid guess id. Refresh the page.");
                    break;
                }
            default:
                {
                    setError(Enum.FAIL_NAME.INTERNAL, "Something went wrong. Try guessing again.");
                    setTimeout(enableGuessButton, 2500);
                    break;
                }
        }
        return true;
    }

    function handleGuessFailedToRegister()
    {
        setError(Enum.FAIL_NAME.INTERNAL, "Check the stream to confirm your guess and try again.");
        setTimeout(enableGuessButton, 5000);
    }

    async function watchAndReportGuessState(guessid: number)
    {
        const interval = 500;
        const tries = 6;
        var i = 0;
        var status = Enum.GuessState.Submitted;

        while (i++ < tries)
        {
            await new Promise((res) => setTimeout(res, interval));
            status = await Connection.getGuessState(guessid)
            console.log(`Guess(${guessid}) status: ${status}`);
            if (determineGuessStatus(status)) return;
        }

        handleGuessFailedToRegister()
    }

    /** Enable guess button */
    export function enableGuessButton()
    {
        if (!Control.SendGuessBtn) return

        Control.SendGuessBtn.textContent = `Send Guess to '${StreamerName}'${(IsMobile ? "" : " (SPACEBAR)")}`;
        guessButtonState(true);
    }

    /** Cache user data locally */
    function handleLocalStorage()
    {
        if (!User.profile_image_url) User.profile_image_url = localStorage.getItem("user_profile_image_url") ?? "";
        if (!User.id) User.id = localStorage.getItem("user_id") ?? "";
        if (!User.login) User.login = localStorage.getItem("user_login") ?? "";
        if (!User.display_name) User.display_name = localStorage.getItem("user_display_name") ?? "";

        if (User.profile_image_url) localStorage.setItem("user_profile_image_url", User.profile_image_url);
        if (User.id) localStorage.setItem("user_id", User.id);
        if (User.login) localStorage.setItem("user_login", User.login);
        if (User.display_name) localStorage.setItem("user_display_name", User.display_name);
    }

    /** Set button and control instances */
    function setControls()
    {
        Control.SatelliteLayerBtn = document.getElementById("inputSate");
        Control.StreetsLayerBtn = document.getElementById("inputStMp");
        
        Control.ColorBtn = document.getElementById("colorBtn");
        Control.FlagBtn = document.getElementById("flagsBtn");
        Control.ReloadBtn = document.getElementById("reloadBtn");

        Control.RandomBtn = document.getElementById("randomBtn");
        Control.SendGuessBtn = document.getElementById("guessBtn");
    }

    /** Set the map instance */
    function setMap()
    {
        Map?.remove();

        Map = L.map('map', 
        {
            tap: false,
            fadeAnimation: true
        });

        Map.setView([0, 0], Constant.MIN_ZOOM);
        Map.attributionControl.addAttribution(Constant.ATTRIBUTIONS);

        Layers[CurrentLayer].addTo(Map);
    }
    
    /** Finalize main initializing */
    async function EndInitialize()
    {
        CurrentPopup = L.popup()
            .setLatLng([0, 0])
            .setContent('<b>Click somewhere and click "Send Guess" to make your guess!</b>')
            .openOn(Map);

        await collectHelix();
            
        if (!TwitchExt.viewer.isLinked)
        {
            TwitchExt.actions.requestIdShare();
            await collectHelix();
        }

        handleLocalStorage();

        if (User.profile_image_url)
        {
            var avatar = new LeafIcon({
                iconUrl: User.profile_image_url,
            })
            CurrentMarker = new L.Marker([0, 0],{icon:avatar}).addTo(Map);
        }

        var i = document.createElement("style");
        i.innerHTML = `img[src='${User.profile_image_url}']{border: 3px solid white; border-radius: 100%;}`;
        document.head.appendChild(i);

        await Connection.startConnection(StreamerName)
            .then(enableGuessButton)
            .catch(console.error)

        Initialized = new Date();
    }

    /** Begin initializing process */
    function BeginInitialize()
    {
        guessButtonState(false);

        setMap();

        setControls();

        addEventListeners();

        setTimeout(EndInitialize, 750);
    }

    /** Main entry point */
    export function Main()
    {
        console.log("Main invoked")
        Invoked = new Date();

        TwitchExt = window.Twitch.ext;
        IsMobile = new URLSearchParams(window.location.search).get('platform') == "mobile"

        BeginInitialize();
    }
}

window.App = App;