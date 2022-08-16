/// <reference path="types.d.ts"/>

import { Enum } from "./enums"

declare global
{
    /** Map layers */
    export type LAYER = Enum.LAYER
    /** Error types */
    export type FAIL_NAME = Enum.FAIL_NAME
    /** Guess states */
    export type GuessState = Enum.GuessState
    /** Logging levels */
    export type LOGLEVEL = Enum.LOGLEVEL
    /** Main global logger */
    export var Logger: LoggerConsole;
    /** Debug/info line */
    export var DebugLine: Nullable<HTMLElement>;
    /** Set message to debug line in the bottom */
    export var Msg: (msg: any) => any;
    /** Push message to log messages */
    export var Debug: (msg: any) => any;
    /** Log messages */
    export var Messages: any[];
}

/** Log messages */
window.Messages = [];

/** Debug line element on the bottom of the screen */
window.DebugLine = document.getElementById("debugLine");

/** Debug message wrapper */
window.Debug = function(msg: string): string
{
    try
    {
        let d = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        let m = `[${d}] ${JSON.stringify(msg)}`;
        Messages.push(m);
        return m
    }
    catch
    {
        return msg;
    }
}

/** Logger message wrapper */
window.Msg = function(msg: string): string
{
    try
    {
        let d = Debug(msg);
        if (DebugLine) 
        {
            DebugLine.textContent = d;
            DebugLine.title = msg;
            DebugLine.dataset["tooltip"] = DebugLine.textContent ?? msg;
        }
        return msg
    }
    catch
    {
        return msg;
    }
}

window.Logger =
{
    assert: function() {},
    error: function() {},
    warn: function() {},
    info: function() {},
    debug: function() {},
    log: function() {},
    LoggingLevel: Enum.LOGLEVEL.DEBUG,
    IsInitialized: false,
    Initialize(level: Enum.LOGLEVEL.DEBUG) {
        if (this.IsInitialized) return;

        this.IsInitialized = true;
        this.LoggingLevel = level;

        if (this.LoggingLevel >= Enum.LOGLEVEL.ASSERT) this.assert = console.assert.bind(window.console);
        
        if (this.LoggingLevel >= Enum.LOGLEVEL.ERROR) this.error = console.error.bind(window.console);
        
        if (this.LoggingLevel >= Enum.LOGLEVEL.WARN) this.warn = console.warn.bind(window.console);

        if (this.LoggingLevel >= Enum.LOGLEVEL.INFO) this.info = console.info.bind(window.console);

        if (this.LoggingLevel >= Enum.LOGLEVEL.DEBUG) this.debug = console.debug.bind(window.console);

        if (this.LoggingLevel >= Enum.LOGLEVEL.VERBOSE) this.log = console.log.bind(window.console);
    }
};