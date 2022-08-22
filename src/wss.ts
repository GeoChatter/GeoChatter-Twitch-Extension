import * as signalR from '@microsoft/signalr';
import { Constant } from "./constants";
import { Enum } from "./enums";
import { Setting } from './settings';

/** WSS methods */
export namespace Connection
{
    /** Map layers and available endpoints */
    export var ExtensionService: GeoChatterExtensionService = {
        Layers: {},
        Service: {
            Borders: "",
            Flags: "",
            ISO: ""
        }
    };

    /** Main connection */
    export const CurrentConnection: signalR.HubConnection = new signalR.HubConnectionBuilder()
        .withUrl(Constant.DEBUG ? Constant.DEV_HUB : Constant.PROD_HUB, {})
        .build();

    /** Stop current connection */
    export async function StopConnection()
    {
        Logger.info(Msg("Stopping current connection"))
        await CurrentConnection.stop()
    }

    /** Set settings */
    function setStreamerSettings(options: StreamerSettings)
    {
        Logger.log(Msg("Setting streamer settings"), Msg(options))
        Object.entries(options).forEach(([key, value]) => {

            if (key === "isUSStreak") {
                key = "borderAdmin"
                value = !value
            }
            Setting.ChangeStreamerSettings(key as keyof StreamerSettings, value)
        })
    }

    /** Listen to setting changes */
    function listenToMapFeatures()
    {
        Logger.log(Msg("Listening to map features"))

        CurrentConnection.on("SetMapFeatures", function (options) {
            Logger.log(Msg("SetMapFeatures"), Debug(options))
            setStreamerSettings(options)
        })
    };

    /** Reconnect */
    async function reconnect(mapId?: string)
    {
        try
        {
            if (!mapId) return Logger.warn(Msg("Can not reconnect with empty mapId"));

            Logger.info(Msg("Reconnecting"))

            await CurrentConnection.start()

            await mapLogin(mapId);
        }
        catch(e)
        {
            Logger.error(Msg(e));
        }
    }

    /** Get map initial data */
    async function mapLogin(mapId: string)
    {
        try
        {
            if (!mapId) return Logger.warn(Msg("Can not invoke MapLogin with invalid mapId"));

            Logger.log(Msg("Invoke MapLogin, mapId"), Debug(mapId));

            const res = await CurrentConnection.invoke("MapLogin", mapId);

            if (res)
            {
                Logger.log(Msg("MapLogin received"), Debug(res))
                setStreamerSettings(res)
                return true
            }
            else
            {
                Logger.warn(Msg("MapLogin empty"))
                return false
            }
        }
        catch(e)
        {
            Logger.error(Msg(e));
            return false
        }
    }

    /** Listen to failures */
    function listenToProblems(mapId: string)
    {
        Logger.log(Msg("Listening connection close events"))
        CurrentConnection.onreconnecting = (e: any) => {
            Logger.log(Msg("Default reconnecting from singalR"),Debug(e))
        }
        CurrentConnection.onclose = (e: any) => {
            Logger.log(Msg("SignalR connection closed trying to reconnect manually"), Debug(e))
            setTimeout(() => reconnect(mapId), 1000)
        }
    }

    /** Start the connection */
    export async function StartConnection(botName: string): Promise<{state: CONNECTIONSTART_STATE, msg: string}>
    {

        try 
        {            
            if (!botName) return Logger.error(Msg("Can't invoke MapLogin with invalid botName"))

            await CurrentConnection.start()
            Logger.info(Msg("Connection started"))

            let id = await GetMapID(botName)
                .catch(err => {
                    Logger.error(Msg(err));
                })
            if (id)
            {
                Setting.MapId = id;
                Logger.log(Msg("MapId received"), Debug(Setting.MapId))
            }
            else
            {
                Logger.warn(Msg("MapId empty"))
            }

            if (!Setting.MapId)
            {
                return {
                    msg: "Stopping the connection because no game was found for the streamer.",
                    state: Enum.CONNECTIONSTART_STATE.ERROR
                };
            }

            let s = await Connection.SetService()
            if (!s)
            {
                return {
                    msg: "Failed to get providers, reload the page.",
                    state: Enum.CONNECTIONSTART_STATE.ERROR
                };
            }

            s = await mapLogin(Setting.MapId);
            if (!s)
            {
                return {
                    msg: Setting.MapId + " named game couldn't be found, reload the page.",
                    state: Enum.CONNECTIONSTART_STATE.ERROR
                };
            }
            
            listenToMapFeatures()

            listenToProblems(botName)

            return {
                msg: "",
                state: Enum.CONNECTIONSTART_STATE.STARTED
            };
        }
        catch (err) 
        {
            Logger.error(Msg(err))
            return {
                msg: (err as string)?.toString(),
                state: Enum.CONNECTIONSTART_STATE.ERROR
            };
        }
    }

    /** Send a guess */
    export async function SendGuess(guess: GuessData): Promise<[string | unknown, number]>
    {
        try 
        {
            if (!VerifyMessage(guess) 
                || !guess.lat 
                || !guess.lng 
                || (guess.isRandom && guess.isTemporary)) return Logger.error(Debug("Can't invoke SendGuessToClients with invalid data"), Debug(guess))

            if (CurrentConnection.state !== "Connected") 
            {
                Logger.warn(Msg("Not connected, trying to reconnect before sending guess"))

                await reconnect(guess.bot)
                    .catch(e => [e, -1]);

                Logger.log(Msg("Sending guess after reconnect"), Debug(guess))

                let r = await _sendGuess(guess)
                    .catch(e => [e, -1]);

                return r as [any, any];
            } 
            else
            {
                return await _sendGuess(guess)
            }
        }
        catch (err) 
        {
            Logger.error(Msg(err));
            return [err, -1]
        }
    }

    async function _sendGuess(guess: GuessData): Promise<[string | unknown, number]>
    {
        let res: number = -1
        try 
        {
            Logger.log(Debug("Invoke SendGuessToClients, guess data:"), Debug(guess))
            res = await CurrentConnection.invoke("SendGuessToClients", guess)
        }
        catch (err) 
        {
            Logger.error(Msg(err));
            return [err, -1]
        }
        return ["", res]
    }

    /** Get endpoint and layers */
    export async function SetService(): Promise<boolean>
    {
        try 
        {
            Logger.log(Debug("Invoke GetTileProvider"))
            let res: Nullable<string> = await CurrentConnection.invoke("GetTileProvider");

            if (!res)
            {
                Logger.error(Msg("Failed to get GeoChatter service providers"))
                return false
            }
            Logger.info(Msg("Successfully set GeoChatter service providers"), Debug(res));
            ExtensionService = JSON.parse(res);
            return true;
        } 
        catch (err) 
        {
            Logger.error(Msg(err))
            return false
        }
    }

    /** Send user flag request */
    export async function SendFlag(data: FlagData)
    {
        try 
        {
            if (!VerifyMessage(data) || !data.flag) return Logger.error(Debug("Can't invoke SendFlagToClients with invalid data"), Debug(data))

            Logger.log(Debug("Invoke SendFlagToClients, flag data"), Debug(data))
            await CurrentConnection.invoke("SendFlagToClients", data)
        } 
        catch (err) 
        {
            Logger.error(Msg(err))
        }
    }

    /** Send user color request */
    export async function SendColor(data: ColorData)
    {
        try 
        {
            if (!VerifyMessage(data) || !data.color) return Logger.error(Debug("Can't invoke SendColorToClients with invalid data"), Debug(data))

            Logger.log(Debug("Invoke SendColorToClients, color data:"), Debug(data))
            await CurrentConnection.invoke("SendColorToClients", data)
        } 
        catch (err) 
        {
            Logger.error(Msg(err))
            return err
        }
    }

    /** Get state of a sent guess */
    export async function GetGuessState(id:number): Promise<GuessState>
    {
        try 
        {
            if (id <= 0) return Logger.error(Debug("Can't invoke GetGuessState with invalid id"), Debug(id))

            Logger.log(Debug("Invoke GetGuessState, id:"), Debug(id))
            return await CurrentConnection.invoke("GetGuessState", id)
        } 
        catch (err) 
        {
            Logger.error(Msg(err))
            return Enum.GuessState.UndefinedError;
        }
    }
    
    /** Get map id for the current connection */
    export async function GetMapID(channelName:string): Promise<string>
    {
        try 
        {
            if (!channelName) return Logger.error(Debug("Can't invoke GetMapId with invalid channelName"))

            Logger.log(Debug("Invoke GetMapId, channelName:"), Debug(channelName))
            return await CurrentConnection.invoke("GetMapId", channelName)
        } 
        catch (err) 
        {
            Logger.error(Msg(err))
            return ""
        }
    }

    function VerifyMessage(data: UserData)
    {
        return data && data.bot && data.tkn && data.src && data.sourcePlatform;
    }
}

window.Connection = Connection;