import { Constant, Enum, App } from "./core"
import { Connection } from "./wss"
import * as L from 'leaflet';

function addEventListeners()
{
    if (!isMobile){
        document.body.addEventListener("keydown",
        (e) => e.code == "Space" ? sendGuessClick() : null)
    }

    guessBtn?.addEventListener("click", sendGuessClick);

    layerTr?.addEventListener("click", () =>{
        App.Map.removeLayer(App.Layers[App.CurrentLayer]);
        App.CurrentLayer = Enum.LAYER.SATELLITE;
        App.Layers[App.CurrentLayer].addTo(App.Map);
    })
    
    layerSi?.addEventListener("click", () =>{
        App.Map.removeLayer(App.Layers[App.CurrentLayer]);
        App.CurrentLayer = Enum.LAYER.STREETS;
        App.Layers[App.CurrentLayer].addTo(App.Map);
    })
}

function guessButtonState(state = false)
{
    if (!guessBtn) return;

    if(state)
    {
        App.Disabled = false;
        guessBtn.style.backgroundColor = "#19770be3";
        guessBtn.style.cursor = "pointer";
    }
    else
    {
        App.Disabled = true;
        guessBtn.style.backgroundColor = "#6b6b6bd6";
        guessBtn.style.cursor = "default";
    }
}

function sendGuessClick(){
    if ((App.LastError != Enum.FAIL_NAME.NONE) || !App.Initialized || App.Disabled || !guessBtn) return;

    guessButtonState(false);

    if (!twitch.viewer.isLinked) {
        guessBtn.textContent = "Can't guess without granting access!"
            + (isMobile ? "Open extension settings and grant access!" : "Reload the page to get the access prompt.");
        App.LastError = Enum.FAIL_NAME.UNAUTHORIZED;
        return;
    }

    var send: GuessData & {[k: string]: any} = {
    "bot": `${App.GameName}`,
    "lat": `${App.CurrentGuess.lat}`,
    "lng": `${App.CurrentGuess.lng}`,
    "hlx": `${(App.AuthData.helixToken ? App.AuthData.helixToken : "")}`,
    "tkn": `${App.AuthData.token}`,
    "id": `${App.User.id ? App.User.id : twitch.viewer.id}`,
    "name": `${App.User.login}`,
    "display": `${App.User.display_name}`,
    "pic": `${App.User.profile_image_url}`,
    isTemporary: false, isRandom: false,
    sourcePlatform: "Twitch",
    "src": "extension"
};

    sendGuess(send);
}

async function collectHelix() {
    
    var id = twitch.viewer.id;
    var hlx = isMobile ? App.AuthData.helixToken : twitch.viewer.helixToken;
    if (!hlx || !id) return;

    App.helix['Authorization'] = 'Extension ' + hlx

    await fetch(
        'https://api.twitch.tv/helix/users/?id=' + id,
        {
            method: 'GET',
            headers: App.helix,
        }
    )
    .then(resp => {
        return resp.json();
    })
    .then(resp => {
        App.User = resp.data[0];
    })
    .catch(err => {
        console.log(err);
    });
}

function onMapClick(e: L.LeafletMouseEvent) {
    App.Initialized = true;

    if(App.CurrentPopup == null) return;

    App.CurrentGuess.lat = e.latlng.lat;
    App.CurrentGuess.lng = e.latlng.lng;


    if (App.CurrentMarker != null)
    {
        App.CurrentMarker.setLatLng(e.latlng);
    }

    if (App.LastError != Enum.FAIL_NAME.NONE)
    {
        App.CurrentPopup
            .setLatLng(e.latlng)
            .setContent(`<p style="font-weight:bold;text-align:center; margin:0 !important;">${App.FAIL_MESSAGE[App.LastError]}</p>`) 
            .openOn(App.Map);

        if (guessBtn) guessBtn.textContent = App.FAIL_MESSAGE[App.LastError];
    }
    else
    {
        if (App.CurrentMarker != null)
        {
            App.Map.closePopup()
        }
        else{
            App.CurrentPopup
                .setLatLng(e.latlng)
                .setContent(`<p style="font-weight:bold;text-align:center; margin:0 !important;">Press the button to make a guess</p>`) 
                .openOn(App.Map);
        }
    }
}

function setError(name: FAIL_NAME)
{
    console.error(name);
    App.LastError = name;
    if (guessBtn) guessBtn.textContent = App.FAIL_MESSAGE[App.LastError]
}

function sendGuess(data: GuessData)
{
    if (!App.CanSendGuess || (App.LastError != Enum.FAIL_NAME.NONE)) return

    App.CanSendGuess = false;
    Connection.sendGuess(data)
        .then(res =>
        {
            console.log(res);
            if (res[1] < 0)
            {
                setError(Enum.FAIL_NAME.SERVER_OFFLINE)
            }
            else{
                enableGuessButton();
            }
        })
        .catch(() => setError(Enum.FAIL_NAME.INTERNAL))
}

function enableGuessButton()
{
    if (!guessBtn) return

    guessBtn.textContent = `Send Guess${(isMobile ? "" : " (SPACEBAR)")}`;
    App.CanSendGuess = true;
    guessButtonState(true);
}

const twitch = window.Twitch.ext;
const isMobile = new URLSearchParams(window.location.search).get('platform') == "mobile"

const guessBtn = document.getElementById("guessBtn");
const layerTr = document.getElementById("inputSate");
const layerSi = document.getElementById("inputStMp");

twitch.configuration.onChanged(function() {
    if (twitch.configuration.broadcaster) {
      try {
        var config = JSON.parse(twitch.configuration.broadcaster.content);
        if (typeof config === 'object' && "gc_botname" in config) {
          App.GameName = config.gc_botname;
        }
      } catch {}
    }
});

twitch.onAuthorized(async (a) => {
    App.AuthData = {
        channelId: a.channelId,
        clientId: a.clientId,
        helixToken: a.helixToken,
        token: a.token,
        userId: a.userId,
    };
    await collectHelix();
});

App.Layers[App.CurrentLayer].addTo(App.Map);
App.Map.attributionControl.addAttribution(Constant.ATTRIBUTIONS)

App.Map.on('click', onMapClick);

guessButtonState(false);

setTimeout(async () => 
{
    App.CurrentPopup = L.popup()
        .setLatLng([0, 0])
        .setContent('<b>Click a location and press the "Send Guess" button to make your guess!</b>')
        .openOn(App.Map);

    await collectHelix();

    addEventListeners();
        
    enableGuessButton();

    if (!twitch.viewer.isLinked)
    {
        twitch.actions.requestIdShare();
        await collectHelix();
    }

    if (!isMobile || App.User.profile_image_url)
    {
        var avatar = new App.LeafIcon({
            iconUrl: App.User.profile_image_url,
        })
        App.CurrentMarker = new L.Marker([0, 0],{icon:avatar}).addTo(App.Map);
    }

    var i = document.createElement("style");
    i.innerHTML = `img[src='${App.User.profile_image_url}']{border: 3px solid white; border-radius: 100%;}`;
    document.head.appendChild(i);

    await Connection.startConnection(App.GameName)
}, 1250);