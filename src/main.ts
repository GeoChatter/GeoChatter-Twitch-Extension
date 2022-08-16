import "./core"
import { App } from "./app"
import { Constant } from "./constants";
import { Enum } from "./enums";

/** Set the logger */
if (Constant.DEBUG)
{
    Logger.Initialize(Enum.LOGLEVEL.VERBOSE);
    Logger.info(Msg("Starting GeoChatter-Map. Environment: Development"))
}
else
{
    Logger.Initialize(Enum.LOGLEVEL.WARN);
    Logger.info(Msg("Starting GeoChatter-Map. Environment: Production"))
}

/** Start the app */
App.Main();