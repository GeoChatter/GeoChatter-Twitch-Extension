/// <reference path="../node_modules/@types/twitch-ext/index.d.ts"/>
/// <reference path="../node_modules/@types/jquery/index.d.ts"/>

declare export global
{
    export interface Window
    {
        /** Main app */
        App: {},
        /** Enums */
        Enum: {},
        /** Constants */
        Constant: {},
        /** Color utilities */
        Color: {},
        /** Controls and elements */
        Control: {},
        /** WSS Connection Utils */
        Connection: {},
        /** App settings */
        Setting: {},
    }

    /** T may be null or undefined */
    export type Nullable<T> = T | null | undefined;

    /** A value of T */
    export type ValueOf<T> = T[keyof T];

    /** Coordinates */
    export type Coordinates = {
        /** Latitude */
        lat: number,
        /** Longitude */
        lng: number,
        /** Wheter to use randomization, ignoring values sent */
        randomize: boolean
    }

    /** Settings set by streamer */
    export type StreamerSettings = {
        /** Allow drawing borders */
        borders: boolean,
        /** Allow displaying flags */
        flags: boolean,
        /** Allow stream popup */
        streamOverlay: boolean,
        /** ADM-1 level borders, disable for US-streak games */
        borderAdmin: boolean,
        /** Allow temporary guesses */
        temporaryGuesses: boolean,
        /** Streamer name */
        streamer: Nullable<string>,

        [key: string]: any
    }

    export type GeneralSettings = {
        /** Unused */
        _3d: boolean,
        /** Unused */
        sens: number,
        /** Unused */
        ex: number,
        /** Unused */
        globe: boolean,
        /** Unused */
        copyAndPaste: boolean,
        /** Unused */
        drawerOpen: boolean,
        /** Unused */
        globeView: boolean,
        /** Unused */
        testing: boolean,
        
        [key: string]: any
    }
    
    export type UserData = {
        bot: string;
        hlx: string;
        tkn: string;
        src: "extension";
        sourcePlatform: "Twitch"
        id: string;
        name: string;
        display: string;
        pic: string;
    }

    export type GuessData = {
        lat: string;
        lng: string;
        isTemporary: boolean;
        isRandom: boolean;
    } & UserData

    export type FlagData = {
        flag: string;
    } & UserData

    export type ColorData = {
        color: string;
    } & UserData

}