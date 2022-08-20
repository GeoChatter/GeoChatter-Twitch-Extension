/** Enums */
export namespace Enum
{    
    /** Map layers available */
    export const enum LAYER 
    {
        /** Streets layer */
        STREETS = "0",
        /** Satellite layer */
        SATELLITE = "1",
        /** Satellite layer (No label) */
        SATELLITE_NOLABEL = "2",
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

    /** Logging level */
    export const enum LOGLEVEL
    {
        ASSERT = 1,
        ERROR = 2,
        WARN = 3,
        INFO = 4,
        DEBUG = 5,
        VERBOSE = 6
    }
    
    /** Connection state while its starting */
    export const enum CONNECTIONSTART_STATE
    {
        /** Started the connection successfully */
        STARTED = 0,
        /** Internal error */
        ERROR = 1
    }
}

window.Enum = Enum;