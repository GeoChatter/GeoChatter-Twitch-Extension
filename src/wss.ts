/// <reference path="types.d.ts" />
import * as signalR from '@microsoft/signalr';
import {Constant} from './core';
import {Setting} from './settings';

/** WSS methods */
export namespace Connection
{
    /** Main connection */
    export const connection: signalR.HubConnection = new signalR.HubConnectionBuilder()
        .withUrl(Constant.DEBUG ? Constant.DEV_HUB : Constant.PROD_HUB, {})
        .build();

    /** Stop current connection */
    export async function stopConnection()
    {
        console.log("Stopping current connection")
        await connection.stop()
    }

    /** Set settings */
    export function setStreamerSettings(options: GeneralSettings)
    {
        console.log("Setting streamer settings", options)
        Object.entries(options).forEach(([key, value]) => {

            key = key.replace("show", "")
            key = key.charAt(0).toLowerCase() + key.slice(1)
            if (key === "isUSStreak") {
                key = "borderAdmin"
                value = !value
            }
            Setting.changeStreamerSettings(key, value)
        })
    }

    /** Listen to setting changes */
    export function listenToMapFeatures()
    {
        console.log("Listening to map features")

        connection.on("SetMapFeatures", function (options) {
            console.log("SetMapFeatures", options)
            setStreamerSettings(options)
        })
    };

    /** Reconnect */
    export async function reconnect(botName?: string)
    {
        if (!botName) return 

        console.log("Reconnecting")

        await connection.start()

        const res = await connection.invoke("MapLogin", botName)
        if (res) {
            setStreamerSettings(res)
        }
    }

    /** Listen to failures */
    export function listenToProblems(botName: string)
    {
        console.log("Listening connection close events")
        connection.onreconnecting = (e: any) => {
            console.log("Default reconnecting from singalR",e)
        }
        connection.onclose = (e: any) => {
            console.log("SignalR connection closed trying to reconnect manually", e)
            setTimeout(() => reconnect(botName), 1000)
        }
    }

    /** Start the connection */
    export async function startConnection(botName: string){

        try 
        {
            const startRes = await connection.start()
            console.log("Connection started", startRes)

            await getMapId(botName)
                .then(id => {
                    Setting.MapId = id;
                    console.log("MapId", Setting.MapId)
                })
                .catch(console.error)


            const res = await connection.invoke("MapLogin", botName)
            if (res) {
                console.log(res)
                setStreamerSettings(res)
            }

            listenToMapFeatures()

            listenToProblems(botName)
        }
        catch (err) 
        {
            console.error(err)
            return err
        }
    }

    /** Send a guess */
    export async function sendGuess(guess: GuessData): Promise<[string | unknown, number]>
    {
        try 
        {
            if (connection.state !== "Connected") 
            {
                console.warn("Not connected, trying to reconnect before sending guess")

                return await reconnect(guess.bot)
                    .then(async () => {
                        console.log("Sending guess after reconnect", guess)
                        return await _sendGuess(guess)
                    })
                    .catch(e => [e, -1]);
            } 
            else
            {
                return await _sendGuess(guess)
            }
        }
        catch (err) 
        {
            console.error(err);
            return [err, -1]
        }
    }

    async function _sendGuess(guess: GuessData): Promise<[string | unknown, number]>
    {
        let res: number = -1
        try 
        {
            console.log("Invoke SendGuessToClients, guess data:", guess)
            res = await connection.invoke("SendGuessToClients", guess)
        }
        catch (err) 
        {
            console.error(err);
            return [err, -1]
        }
        return ["", res]
    }

    /** Send user flag request */
    export async function sendFlagToClients(data: FlagData)
    {
        try 
        {
            console.log("Invoke SendFlagToClients, flag data:", data)
            const res = await connection.invoke("SendFlagToClients", data)
            return res

        } catch (err) 
        {
            console.log(err)
            return err
        }
    }

    /** Send user color request */
    export async function sendColor(data: ColorData)
    {
        console.log("Invoke SendColorToClients, color data:", data)
        await connection.invoke("SendColorToClients", data)
    }

    /** Get state of a sent guess */
    export async function getGuessState(id:number): Promise<GuessState>
    {
        console.log("Invoke GetGuessState, id:", id)
        return await connection.invoke("GetGuessState", id)
    }
    
    /** Get map id for the current connection */
    export async function getMapId(channelName:string): Promise<string>
    {
        console.log("Invoke GetMapId, channelName:", channelName)
        return await connection.invoke("GetMapId", channelName)
    }
}

window.Connection = Connection;