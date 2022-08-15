/// <reference path="types.d.ts"/>

/** Available elements and controls */
export namespace Control 
{
    /** Send Guess button */
    export var SendGuessBtn: Nullable<HTMLElement>;
    /** Color change button */
    export var ColorBtn: Nullable<HTMLElement>;
    /** Color picker input */
    export var ColorPicker: Nullable<HTMLElement>;
    /** Flag change button */
    export var FlagBtn: Nullable<HTMLElement>;
    /** Reload button */
    export var ReloadBtn: Nullable<HTMLElement>;
    /** Random Guess button */
    export var RandomBtn: Nullable<HTMLElement>;
    /** Default Layer button */
    export var SatelliteLayerBtn: Nullable<HTMLElement>;
    /** Satellite Layer button */
    export var StreetsLayerBtn: Nullable<HTMLElement>;
}

window.Control = Control;