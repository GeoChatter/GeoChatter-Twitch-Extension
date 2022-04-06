const twitch = window.Twitch.ext;
const isMobile = new URLSearchParams(window.location.search).get('platform') == "mobile"

const MIN_ZOOM = 2;
const MAX_ZOOM = 22;

const ACCESS_TOKEN = "pk.eyJ1Ijoic2VtaWhtIiwiYSI6ImNsMTF2NGVlNDA5cnoza3JzbmJqMzQwOWsifQ.WxIxVI6jvg8K25f283ttKQ";
const DEFAULT_LAYER = 'https://api.mapbox.com/styles/v1/semihm/ckxvy72ks45v114oe7o1cwbxs/tiles/512/{z}/{x}/{y}@2x?optimize=true&access_token=';
const DEFAULT_SIMPLE_LAYER = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}@2x?optimize=true&access_token=';
const DEFAULT_SAT_LAYER = 'https://api.mapbox.com/styles/v1/semihm/ckyn214e69hp214ppbwu09w59/tiles/512/{z}/{x}/{y}@2x?optimize=true&access_token=';

const SERVER_POST = "https://api.geochatter.tv/guess/";
const SERVER_GET = "https://api.geochatter.tv/guess?botname="
const SERVER_GUESS_CHECK = "https://api.geochatter.tv/guess?id="

const MAX_CHECKS = 6;
const CHECK_INTERVAL = 1500;

const LAYER = {
    STREETS: 0,
    SIMPLE: 1,
    SATELLITE: 2,
} 

const guessBtn = document.getElementById("guessBtn");

const layerMp = document.getElementById("inputLeaf");
layerMp.addEventListener("change", () =>{
    map.removeLayer(layers[currentLayer]);
    layerTr.disabled = false;
    layerTr.checked = false;
    layerSi.disabled = false;
    layerSi.checked = false;

    layerMp.disabled = true;
    currentLayer = LAYER.SIMPLE;
    layers[currentLayer].addTo(map);
})

const layerTr = document.getElementById("inputSate");
layerTr.addEventListener("change", () =>{
    map.removeLayer(layers[currentLayer]);
    layerMp.disabled = false;
    layerMp.checked = false;
    layerSi.disabled = false;
    layerSi.checked = false;

    layerTr.disabled = true;
    currentLayer = LAYER.SATELLITE;
    layers[currentLayer].addTo(map);
})

const layerSi = document.getElementById("inputStMp");
layerSi.addEventListener("change", () =>{
    map.removeLayer(layers[currentLayer]);
    layerMp.disabled = false;
    layerMp.checked = false;
    layerTr.disabled = false;
    layerTr.checked = false;

    layerSi.disabled = true;
    currentLayer = LAYER.STREETS;
    layers[currentLayer].addTo(map);
})

const FAIL_NAME =
{
    NONE: 0,
    UNAUTHORIZED: 1,
    SERVER_OFFLINE: 2,
    CHANNEL_OFFLINE: 3,
    MIDDLEWARE_OFFLINE: 4,
}

const FAIL_MESSAGE = 
{
    [FAIL_NAME.NONE]: "",
    [FAIL_NAME.UNAUTHORIZED]: "Access not granted",
    [FAIL_NAME.SERVER_OFFLINE]: "GeoChatter servers are down",
    [FAIL_NAME.CHANNEL_OFFLINE]: "No channel found live for the configured bot",
    [FAIL_NAME.MIDDLEWARE_OFFLINE]: "Something went wrong..."
}

var FAIL_STATE = FAIL_NAME.NONE;

var canSend = true;
var currentLayer = LAYER.STREETS;

var init = false;
var disabled = false;

var latlng = "";
var botname = "";

var last = {lat: 0, lng: 0};

var popup;
var marker;

let helix = {};
let data = {
    id: "",
    login: "",
    display_name: "",
    profile_image_url: ""
};
var cfg = {};
var auth = {
    channelId: "",
    clientId: "",
    helixToken: "",
    token: "",
    userId: ""
};

const layers = 
{
    [LAYER.STREETS]: L.tileLayer(DEFAULT_LAYER + ACCESS_TOKEN, {
        attribution: 'GeoChatter',
        maxZoom: MAX_ZOOM,
        minZoom: MIN_ZOOM,
        tileSize: 512,
        zoomOffset: -1
    }),
    [LAYER.SATELLITE]: L.tileLayer(DEFAULT_SAT_LAYER + ACCESS_TOKEN,{
        attribution: 'GeoChatter',
        maxZoom: MAX_ZOOM,
        minZoom: MIN_ZOOM,
        tileSize: 512,
        zoomOffset: -1
    }),
    [LAYER.SIMPLE]: L.tileLayer(DEFAULT_SIMPLE_LAYER + ACCESS_TOKEN,{
        attribution: 'GeoChatter',
        maxZoom: MAX_ZOOM,
        minZoom: MIN_ZOOM,
        tileSize: 512,
        zoomOffset: -1
    }),
}

function guessButtonState(state = false)
{
    if(state)
    {
        disabled = false;
        guessBtn.style.backgroundColor = "green";
        guessBtn.style.cursor = "pointer";
    }
    else
    {
        disabled = true;
        guessBtn.style.backgroundColor = "grey";
        guessBtn.style.cursor = "default";
    }
}

function sendGuessClick(){
    if ((FAIL_STATE != FAIL_NAME.NONE) || !init || disabled) return;

    guessButtonState(false);

    if (!twitch.viewer.isLinked) {
        guessBtn.textContent = "Can't guess without granting access!"
            + (isMobile ? "Open extension settings and grant access!" : "Reload the page to get the access prompt.");
        FAIL_STATE = FAIL_NAME.UNAUTHORIZED;
        return;
    }

    var send = `{
    "bot": "${botname}",
    "lat": "${last.lat}",
    "lng": "${last.lng}",
    "hlx": "${(auth.helixToken ? auth.helixToken : "")}",
    "tkn": "${auth.token}",
    "id": "${data.id ? data.id : twitch.viewer.id}",
    "name": "${data.login}",
    "display": "${data.display_name}",
    "pic": "${data.profile_image_url}",
    "random": "0",
    "src": "extension"
}`;

    sendGuess(send);
}

async function collectHelix() {
    
    var id = twitch.viewer.id;
    var hlx = isMobile ? auth.helixToken : twitch.viewer.helixToken;
    if (!hlx || !id) return;

    helix = {
        'Client-ID': "ypbq857bb7sih75prqyc8sghbtv9ex",
        'Authorization': 'Extension ' + hlx
    }

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
        data = resp.data[0];
    })
    .catch(err => {
        console.log(err);
    });
}

twitch.configuration.onChanged(function() {
    cfg = twitch.configuration;
    if (twitch.configuration.broadcaster) {
      try {
        var config = JSON.parse(twitch.configuration.broadcaster.content);
        if (typeof config === 'object' && "gc_botname" in config) {
          botname = config.gc_botname;
        }
      } catch {}
    }
});

twitch.onAuthorized(async (a) => {
    auth = {
        channelId: a.channelId,
        clientId: a.clientId,
        helixToken: a.helixToken,
        token: a.token,
        userId: a.userId,
    };
    await collectHelix();
});

function onMapClick(e) {
    init = true;

    if(popup == null) return;

    last.lat = e.latlng.lat;
    last.lng = e.latlng.lng;


    if (marker != null)
    {
        marker.setLatLng(e.latlng);
    }

    if (FAIL_STATE != FAIL_NAME.NONE)
    {
        if (!botname) 
        {
            popup
                .setLatLng(e.latlng)
                .setContent(`<p style="font-weight:bold;text-align:center; margin:0 !important;">${FAIL_MESSAGE[FAIL_STATE]}</p>`) 
                .openOn(map);
            guessBtn.textContent = FAIL_MESSAGE[FAIL_STATE];
        }
        else 
        {
            popup
                .setLatLng(e.latlng)
                .setContent(`<p style="font-weight:bold;text-align:center; margin:0 !important;">${FAIL_MESSAGE[FAIL_STATE]}. Copy paste the text below the screen to chat to make a guess</p>`) 
                .openOn(map);
            guessBtn.textContent = `/w ${botname} ${btoa(last.lat + "," + last.lng)}`;
            selectCmd();
        }
    }
    else
    {
        if (marker != null)
        {
            map.closePopup()
        }
        else{
            popup
                .setLatLng(e.latlng)
                .setContent(`<p style="font-weight:bold;text-align:center; margin:0 !important;">Press the button to make a guess</p>`) 
                .openOn(map);
        }
    }
}

function selectCmd(){
    if (document.selection) { // IE
        var range = document.body.createTextRange();
        range.moveToElementText(guessBtn);
        range.select();
    } else if (window.getSelection) {
        var range = document.createRange();
        range.selectNode(guessBtn);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    }  
}

function sendGuess(data)
{
    if (!canSend || (FAIL_STATE != FAIL_NAME.NONE)) return

    _getStartConnectionCheck(data);
}

function enableGuessButton()
{
    guessBtn.textContent = "Send Guess";
    canSend = true;
    guessButtonState(true);
}

function _getStartConnectionCheck(data)
{
    try
    {
        fetch(SERVER_GET + botname)
            .then(res =>
                {
                    switch(res.status)
                    {
                        case 202:
                        case 200:
                                _sendGuess(data);
                                break;
                            default:
                                FAIL_STATE = FAIL_NAME.CHANNEL_OFFLINE
                                guessBtn.textContent = "No channel online found"
                                break;
                    }
                })
            .catch(() => FAIL_STATE = FAIL_NAME.SERVER_OFFLINE)
    }
    catch
    {
        FAIL_STATE = FAIL_NAME.MIDDLEWARE_OFFLINE;
    }
}

function _sendGuess(data)
{
    try
    {
        fetch(SERVER_POST, 
            {
                method: "POST",
                body: data,
                headers: {'Content-Type': 'application/json'}
            })
            .then((res) => {
                switch(res.status)
                {
                    case 202:
                    case 200:
                        guessBtn.textContent = "Waiting for guess registration..."
                        canSend = false;
                        res.text().then(guessid => _guesscheck(guessid, 0));
                        break;
                    default:
                        FAIL_STATE = FAIL_NAME.SERVER_OFFLINE;
                        guessBtn.textContent = "GeoChatter servers are down"
                        break;

                }
            })
            .catch(() => FAIL_STATE = FAIL_NAME.SERVER_OFFLINE);
    }
    catch
    {
        FAIL_STATE = FAIL_NAME.MIDDLEWARE_OFFLINE;
    }
}

function _guesscheck(id, times)
{
    if (!id || times < MAX_CHECKS)
    {
        times++;
        try
        {
            fetch(SERVER_GUESS_CHECK + id)
                .then(res => {
                    switch(res.status)
                    {
                        case 202:
                        case 200: // done
                            enableGuessButton();
                            break;
                        case 100: // still
                            setTimeout(() => _guesscheck(id, times), CHECK_INTERVAL);
                            break;
                        default: // failure
                            guessBtn.textContent = "Guess registration check failed. Check if your guess is on the scoreboard, if it's not, try again."
                            setTimeout(enableGuessButton, 3000);
                            break;
                    }
                })
                .catch(() => FAIL_STATE = FAIL_NAME.SERVER_OFFLINE);
        }
        catch
        {
            FAIL_STATE = FAIL_NAME.MIDDLEWARE_OFFLINE;
        }
    }
}

var map = L.map('map', {tap: false}).setView([0, 0], MIN_ZOOM);

var LeafIcon = L.Icon.extend({
    options: {
       iconSize:     [32, 32],
       iconAnchor:   [19, 19],
       popupAnchor:  [19, 19]
    }
});

var markerInterval = {
    ID: null
}

layers[currentLayer].addTo(map);
layerSi.disabled = true;

map.on('click', onMapClick);

guessBtn.addEventListener("click", sendGuessClick);

guessButtonState(false);

setTimeout(async () => 
{
    popup = L.popup()
        .setLatLng([0, 0])
        .setContent('<b>Click a location and press the "Send Guess" button to make your guess!</b>')
        .openOn(map);

    guessButtonState(true);
    
    await collectHelix();

    guessBtn.textContent = "Send Guess";

    if (!twitch.viewer.isLinked)
    {
        twitch.actions.requestIdShare();
        await collectHelix();
    }

    if (!isMobile || data.profile_image_url)
    {
        var avatar = new LeafIcon({
            iconUrl: data.profile_image_url,
        })
        marker = L.marker([0, 0],{icon:avatar}).addTo(map);
    }

    markerInterval.ID = setInterval(() => {
        var i = document.querySelector(`img[src='${data.profile_image_url}']`);
        if (i) 
        {
            i.style.border = "3px solid white";
            i.style.borderRadius = "100%";
            clearInterval(markerInterval.ID);
        }
    },100);

}, 1250);