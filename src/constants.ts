/** Constants */
export namespace Constant 
{
    /** Wheter the version is the Debug version */
    export const DEBUG = localStorage.getItem("debugEnabled");

    /** Development endpoint */
    export const DEV_HUB = "https://dev.geochatter.tv/guess/geoChatterHub";
    /** Production endpoint */
    export const PROD_HUB = "https://dev.geochatter.tv/guess/geoChatterHub";

    /** Extension ID */
    export const CLIENT_ID = "ypbq857bb7sih75prqyc8sghbtv9ex";
}

window.Constant = Constant;