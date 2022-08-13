/// <reference path="types.d.ts"/>
import * as L from 'leaflet';

export namespace Constant 
{
    export const HUB = "https://api.geochatter.tv/guess/geoChatterHub";

    export const CLIENT_ID = "ypbq857bb7sih75prqyc8sghbtv9ex";
    export const MIN_ZOOM = 2;
    export const MAX_ZOOM = 22;
    
    export const ATTRIBUTIONS = "&copy; <a title='Tile provider' href='https://www.mapbox.com/about/maps/'>Mapbox</a> &copy; <a title='Map data contributors' href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a title='Extension and game maintainers' href='https://geochatter.tv/?wpautoterms_page=terms-and-conditions'>GeoChatter</a>";
    
    export const ACCESS_TOKEN = "pk.eyJ1Ijoic2VtaWhtIiwiYSI6ImNsMTF2NGVlNDA5cnoza3JzbmJqMzQwOWsifQ.WxIxVI6jvg8K25f283ttKQ";
    export const DEFAULT_LAYER = 'https://api.mapbox.com/styles/v1/semihm/ckxvy72ks45v114oe7o1cwbxs/tiles/512/{z}/{x}/{y}@2x?optimize=true&access_token=';
    export const DEFAULT_SAT_LAYER = 'https://api.mapbox.com/styles/v1/semihm/ckyn214e69hp214ppbwu09w59/tiles/512/{z}/{x}/{y}@2x?optimize=true&access_token=';
}

export namespace Enum
{    
    export const enum LAYER 
    {
        STREETS = 0,
        SATELLITE = 1,
    } 

    export const enum FAIL_NAME
    {
        NONE = "NONE",
        UNAUTHORIZED = "UNAUTHORIZED",
        SERVER_OFFLINE = "SERVER_OFFLINE",
        CHANNEL_OFFLINE = "CHANNEL_OFFLINE",
        INTERNAL = "INTERNAL",
    }
}

declare global
{
    export type LAYER = Enum.LAYER
    export type FAIL_NAME = Enum.FAIL_NAME
}

export namespace App
{
    export var Initialized: boolean = false;
    export var Disabled: boolean = false;

    export var CanSendGuess: boolean = false;

    export var CurrentLayer: LAYER = Enum.LAYER.STREETS;
    export var CurrentPopup: L.Popup;
    export var CurrentMarker: L.Marker;
    export var CurrentGuess = {lat: 0, lng: 0};
    export var LastError: Enum.FAIL_NAME = Enum.FAIL_NAME.NONE;
    
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
    export var latlng = "";
    export var botname = "";

    export var last = {lat: 0, lng: 0};

    export let helix = {
        'Client-ID': Constant.CLIENT_ID,
        'Authorization': 'Extension '
    };
    export let data = {
        id: "",
        login: "",
        display_name: "",
        profile_image_url: ""
    };

    export var auth = {
        channelId: "",
        clientId: "",
        helixToken: "",
        token: "",
        userId: ""
    };

    export var Map = L.map('map', 
    {
        tap: false,
    })
    .setView([0, 0], Constant.MIN_ZOOM);

    export var LeafIcon = L.Icon.extend({
        options: {
            iconSize:     [32, 32],
            iconAnchor:   [19, 19],
            popupAnchor:  [19, 19]
        }
    }) as unknown as any;

    export const FAIL_MESSAGE =
    {
        [Enum.FAIL_NAME.NONE]: "",
        [Enum.FAIL_NAME.UNAUTHORIZED]: "Access not granted!",
        [Enum.FAIL_NAME.SERVER_OFFLINE]: "GeoChatter servers are down! Try again later.",
        [Enum.FAIL_NAME.CHANNEL_OFFLINE]: "No game found with given game code!",
        [Enum.FAIL_NAME.INTERNAL]: "Something went wrong, reload the page."
    }
}
