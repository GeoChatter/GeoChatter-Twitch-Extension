/// <reference path="types.d.ts"/>

/** Constants */
export namespace Constant 
{
    /** Wheter the version is the Debug version */
    export const DEBUG = localStorage.getItem("debugEnabled");

    /** Development endpoint */
    export const DEV_HUB = "https://dev.geochatter.tv/guess/geoChatterHub";
    /** Production endpoint */
    export const PROD_HUB = "https://api.geochatter.tv/guess/geoChatterHub";

    /** Extension ID */
    export const CLIENT_ID = "ypbq857bb7sih75prqyc8sghbtv9ex";
    /** Minimum map zoom level */
    export const MIN_ZOOM = 2;
    /** Maximum map zoom level */
    export const MAX_ZOOM = 22;
    
    /** Map attributions */
    export const ATTRIBUTIONS = "&copy; <a title='Tile provider' href='https://www.mapbox.com/about/maps/'>Mapbox</a> &copy; <a title='Map data contributors' href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a title='Extension and game maintainers' href='https://geochatter.tv/?wpautoterms_page=terms-and-conditions'>GC</a>";
    
    /** Access token for extension domain */
    export const ACCESS_TOKEN = "pk.eyJ1Ijoic2VtaWhtIiwiYSI6ImNsMTF2NGVlNDA5cnoza3JzbmJqMzQwOWsifQ.WxIxVI6jvg8K25f283ttKQ";
    /** Streets tile layer MapBox */
    export const DEFAULT_LAYER = 'https://api.mapbox.com/styles/v1/semihm/ckxvy72ks45v114oe7o1cwbxs/tiles/512/{z}/{x}/{y}@2x?optimize=true&access_token=';
    /** Satellite tile layer MapBox */
    export const DEFAULT_SAT_LAYER = 'https://api.mapbox.com/styles/v1/semihm/ckyn214e69hp214ppbwu09w59/tiles/512/{z}/{x}/{y}@2x?optimize=true&access_token=';
}

/** Enums */
export namespace Enum
{    
    /** Map layers available */
    export const enum LAYER 
    {
        /** Streets layer */
        STREETS = 0,
        /** Satellite layer */
        SATELLITE = 1,
    } 

    /** Error types available */
    export const enum FAIL_NAME
    {
        /** No error or error with custom error message */
        NONE = "NONE",
        /** Authorization error */
        UNAUTHORIZED = "UNAUTHORIZED",
        /** Server offline */
        SERVER_OFFLINE = "SERVER_OFFLINE",
        /** Channel/game offline */
        CHANNEL_OFFLINE = "CHANNEL_OFFLINE",
        /** Internal error */
        INTERNAL = "INTERNAL",
    }

    /** Guess states */
    export const enum GuessState
    { 
        /** State for recently submitted guess */
        Submitted = "Submitted",
        /** State for successfully registered guess */
        Success = "Success",
        /** State for guess not having any game to be sent to */
        NoGame = "NoGame",
        /** State for temporary guesses successfully registering */
        TempSuccess = "TempSuccess",
        /** State for invalid user data */
        NotFound = "NotFound",
        /** State for guess sent by a banned player */
        Banned = "Banned",
        /** State for multiguess not being allowed */
        GuessedAlready = "GuessedAlready",
        /** State for multiguess sent too often */
        TooFast = "TooFast",
        /** State for invalid guess coordinates */
        InvalidCoordinates = "InvalidCoordinates",
        /** State for sending same coordinates back to back */
        SameCoordinates = "SameCoordinates",
        /** State for internal error */
        UndefinedError = "UndefinedError",
        /** State for no game/bot found */
        BotNotFound = "BotNotFound",
        /** State for unknown guess id */
        Unknown = "Unknown"
    }
}

declare global
{
    /** Map layers */
    export type LAYER = Enum.LAYER
    /** Error types */
    export type FAIL_NAME = Enum.FAIL_NAME
    /** Guess state */
    export type GuessState = Enum.GuessState
}

window.Enum = Enum;
window.Constant = Constant;