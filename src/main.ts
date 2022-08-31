import "./core"
import { App } from "./app"
import { Constant } from "./constants";
import { Enum } from "./enums";

/** Set the logger */
if (Constant.DEBUG)
{
    Logger.Initialize(Enum.LOGLEVEL.VERBOSE);
}
else
{
    Logger.Initialize(Enum.LOGLEVEL.WARN);
}

Logger.info(Msg("Starting GeoChatter-Map"))

/** Start the app */
App.Main();