/** Constants */
export namespace Constant 
{
    /** Wheter the version is the Debug version */
    export const DEBUG = localStorage.getItem("debugEnabled");

    /** Development endpoint */
    export const DEV_HUB = "https://dev.geochatter.tv/guess/geoChatterHub";
    /** Production endpoint */
    export const PROD_HUB = "https://api.geochatter.tv/guess/geoChatterHub";

    /** Extension ID */
    export const CLIENT_ID = "ypbq857bb7sih75prqyc8sghbtv9ex";
    /** Minimum map zoom level */
    export const MIN_ZOOM = 2;
    /** Maximum map zoom level */
    export const MAX_ZOOM = 22;
    
    /** Map attributions */
    export const ATTRIBUTIONS = "&copy; <a title='Tile provider' href='https://www.mapbox.com/about/maps/'>Mapbox</a> &copy; <a title='Map data contributors' href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a title='Extension and game maintainers' href='https://geochatter.tv/?wpautoterms_page=terms-and-conditions'>GC</a>";
    
    /** Access token for extension domain */
    export const ACCESS_TOKEN = "pk.eyJ1Ijoic2VtaWhtIiwiYSI6ImNsMTF2NGVlNDA5cnoza3JzbmJqMzQwOWsifQ.WxIxVI6jvg8K25f283ttKQ";
    /** Streets tile layer MapBox */
    export const DEFAULT_LAYER = 'https://api.mapbox.com/styles/v1/semihm/ckxvy72ks45v114oe7o1cwbxs/tiles/512/{z}/{x}/{y}@2x?optimize=true&access_token=';
    /** Satellite tile layer MapBox */
    export const DEFAULT_SAT_LAYER = 'https://api.mapbox.com/styles/v1/semihm/ckyn214e69hp214ppbwu09w59/tiles/512/{z}/{x}/{y}@2x?optimize=true&access_token=';

    /** Name mappings for features */
    export const ISO_URL = 'https://service.geochatter.tv/resources/other/iso.json'

    /** Flag svgs of GeoChatter */
    export const FLAGS_URL = 'https://service.geochatter.tv/resources/flags/content.zip'

    /** Features/borders of GeoChatter */
    export const BORDERS_URL = 'https://service.geochatter.tv/resources/borders/content.zip'
}

window.Constant = Constant;