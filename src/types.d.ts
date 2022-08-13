declare export global
{
    export type ValueOf<T> = T[keyof T];
    
    export type StreamerSettings = {
        borders: boolean,
        flags: boolean,
        streamOverlay: boolean,
        borderAdmin: boolean,
        temporaryGuesses: boolean,
        streamer: any,
        [key: string]: any
    }

    export type GeneralSettings = {
        _3d: boolean,
        sens: number,
        ex: number,
        globe: boolean,
        copyAndPaste: boolean,
        drawerOpen: boolean,
        globeView: boolean,
        testing: boolean
    } & StreamerSetting
    
    export type UserData = {
        bot: string;
        tkn: string;
        sourcePlatform: "Twitch" | "YouTube"
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