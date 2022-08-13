/// <reference path="types.d.ts" />
import * as signalR from '@microsoft/signalr';
import {Constant} from './core';
import {Setting} from './settings';

export namespace Connection
{
    export const connection = new signalR.HubConnectionBuilder().withUrl(Constant.HUB, {}).build();

    export const killConnection = async () => {
        await connection.stop()
    }
    export function setStreamerSettings(options: GeneralSettings){
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
    export function listenToMapFeatures()
    {
        connection.on("SetMapFeatures", function (options) {
            setStreamerSettings(options)
            console.log(options)
        })
    };

    export async function reconnect(botName?: string){
        if (!botName) return 
        console.log("reconnecting")
        await connection.start()
        const res = await connection.invoke("MapLogin", botName)
        if (res) {
            setStreamerSettings(res)
        }
    }

    export function listenToProblems(botName: string){
        connection.onreconnecting = (e: any) => {
            console.log("default reconnecting from singalR",e)
        }
        connection.onclose = (e: any) => {
            console.log("signalR connection closed trying to reconnect manually", e)
            setTimeout(() => reconnect(botName), 1000)
        }
    }

    export async function startConnection(botName: string){

        // start the connection and login to client
        try {
            const startRes = await connection.start()
            console.log("connection started", startRes)
            const res = await connection.invoke("MapLogin", botName)
            if (res) {
                console.log(res)
                setStreamerSettings(res)
            }
            console.log("logged in to map", res)
            listenToMapFeatures()
            console.log("listening to map features")
            listenToProblems(botName)
        }
        catch (err) {
            console.log(err)
            return err
        }


    }

    export async function sendGuess(guess: GuessData): Promise<[string | unknown, number]>{
        let res: number = 0
        try {
            if (connection.state !== "Connected") {
                console.log("not connected trying to reconnect before sending guess")
                reconnect(guess.bot).then(async () => {
                    console.log("sending guess after reconnect")
                    res = await connection.invoke("SendGuessToClients", guess)
                }).catch(e => {console.log(e)})
            } else{
                res = await connection.invoke("SendGuessToClients", guess)
            }
        }
        catch (err) {
            return [err, -1]
        }
        return ["", res]
    }

    export async function SendFlagToClients(data: FlagData){
        try {
            const res = await connection.invoke("SendFlagToClients", data)
            return res

        } catch (err) {
            console.log(err)
            return err
        }
    }

    export async function sendColor(data: ColorData){
        await connection.invoke("SendColorToClients", data)
    }

    export async function getGuessState(id:number){

        return await connection.invoke("GetGuessState", id)
    }
}