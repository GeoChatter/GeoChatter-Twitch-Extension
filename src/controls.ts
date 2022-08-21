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
    export var FlagDropdown: Nullable<HTMLElement>;

    /** Layers button */
    export var LayersBtn: Nullable<HTMLElement>;
    /** Layers dropdown */
    export var LayersDropdown: Nullable<HTMLElement>;

    /** Settings button */
    export var SettingBtn: Nullable<HTMLElement>;
    /** Settings window */
    export var SettingCard: Nullable<HTMLElement>;

    /** Settings button */
    export var FlagCB: Nullable<HTMLInputElement>;
    /** Settings button */
    export var BorderCB: Nullable<HTMLInputElement>;
    /** Settings button */
    export var TempCB: Nullable<HTMLInputElement>;

    /** Logs info button */
    export var InfoBtn: Nullable<HTMLElement>;
    /** Reload button */
    export var ReloadBtn: Nullable<HTMLElement>;

    /** Random Guess button */
    export var RandomBtn: Nullable<HTMLElement>;

    /** Satellite Layer button */
    export var SatelliteLayerBtn: Nullable<HTMLElement>;
    /** Satellite No Label Layer button */
    export var SatelliteNoLabelLayerBtn: Nullable<HTMLElement>;
    /** Streets Layer button */
    export var StreetsLayerBtn: Nullable<HTMLElement>;
    /** Outdoors Layer button */
    export var OutdoorsLayerBtn: Nullable<HTMLElement>;
}

window.Control = Control;