/// <reference path="../node_modules/@types/twitch-ext/index.d.ts"/>
/// <reference path="../node_modules/@types/geojson/index.d.ts"/>
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
        /** Main global logger */
        Logger: LoggerConsole;
    }

    /** Logger interface */
    export interface LoggerConsole 
    {
        /** console.assert bind */
        assert(condition: boolean, ...data: any[]),
        /** console.assert bind */
        assert(...data: any[]),
        /** console.error bind */
        error(...data: any[]),
        /** console.warn bind */
        warn(...data: any[]),
        /** console.info bind */
        info(...data: any[]),
        /** console.debug bind */
        debug(...data: any[]),
        /** console.log bind */
        log(...data: any[]),
        /** Current logging level */
        LoggingLevel: LOGLEVEL,
        /** Initialize state */
        IsInitialized: boolean,
        /** Initialize the logger with given level */
        Initialize(level: Enum.LOGLEVEL.DEBUG): void
    }

    /** Twitch Config Broadcaster content */
    export type BroadcasterConfig = 
    {
        GGUserID: string,
        Environment: "production" | "development"
    };
    
    /** SVG dictionary */
    export type SVGDictionary = 
    { 
        [key: string]: string 
    }

    /** ISO model */
    export type ISOData = 
    {
        name: string,
        Alpha2: string,
        Alpha3: string,
        NumericCode: number
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
        lng: number
    }

    /** Settings set by streamer */
    export type StreamerSettings = {
        /** UNUSED: Game mode */
        gameMode: Nullable<"DEFAULT" | "STREAK">,
        /** UNUSED: Flag packs installed on streamer client */
        installedFlagPacks: {},
        /** Wheter ADM-1 level borders are preferred over ADM-0 */
        borderAdmin: boolean,
        /** Wheter country streaks game mode is US state streaks */
        isUSStreak: boolean,
        /** Map ID of client */
        mapIdentifier: Nullable<string>,
        /** Allow drawing borders */
        showBorders: boolean,
        /** Allow displaying flags */
        showFlags: boolean,
        /** UNUSED: Allow stream popup */
        showStreamOverlay: boolean,
        /** Streamer name */
        streamer: Nullable<string>,
        /** Allow temporary guesses */
        temporaryGuesses: boolean,
        /** TODO: remove this */
        [key: string]: any
    }

    /** GeoChatter map feature collection */
    export type GCFeatureCollection =
    {
        name: string,
    } & GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, GCFeatureProperties>

    /** GeoChatter map feature properties */
    export type GCFeatureProperties =
    {
        /** Feature parent */
        shapeGroup: string
        /** Feature name */
        shapeName: string
        /** Feature code */
        shapeISO: string
        /** Feature level */
        shapeLevel: "ADM0" | "ADM1" | "ADM2"
    }

    /** Leaflet tile layer data from GeoChatter services */
    export type Layer = {
        /** Tile Provider */
        provider: "MapBox" | "Google" | "OSM"
        /** Tile layer url OR google maps layer type */
        source: string
        /** Access token for MapBox */
        access_token: string
        /** Layer attributions */
        attributions: string
        /** Minimum zoom level */
        min_zoom: number
        /** Maximum zoom level */
        max_zoom: number
        /** Tile size */
        tile_size: number
        /** Zoom offset */
        zoom_offset: number
        /** Map center */
		center: [number, number]
        /** Map options */
		options: L.MapOptions

        /** Leaflet layer instance, gets set after initializer finalizes */
        LeafletLayer?: L.Layer
    }

    /** Links for utility services */
    export type Service = {
        /** ISO data url */
        ISO: string
        /** GeoChatter borders url */
        Borders: string
        /** GeoChatter flags url */
        Flags: string
    }

    /** Layer and Link provider service */
    export type GeoChatterExtensionService = {
        /** Available layers for the extension */
        Layers: {
            /** Layer name and data */
            [name: string]: Layer
        }
        /** Service endpoints */
        Service: Service
    }

    /** Twitch user data */
    export type UserData = {
        /** Map ID */
        bot: string;
        /** UNUSED: Helix token */
        hlx: string;
        /** Token */
        tkn: string;
        /** User Source */
        src: "extension";
        /** User Platform */
        sourcePlatform: "Twitch"
        /** User id */
        id: string;
        /** User login name */
        name: string;
        /** User display name */
        display: string;
        /** User picture */
        pic: string;
    }

    /** SendGuess event args */
    export type GuessData = {
        /** Latitude */
        lat: string;
        /** Longitude */
        lng: string;
        /** Is a temporary guess */
        isTemporary: boolean;
        /** Is a random guess */
        isRandom: boolean;
    } & UserData

    /** SendFlag event args */
    export type FlagData = {
        /** Flag code */
        flag: string;
    } & UserData

    /** SendColor event args */
    export type ColorData = {
        /** HEX color */
        color: string;
    } & UserData
}