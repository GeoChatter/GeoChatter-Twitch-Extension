import { Feature, Geometry, FeatureCollection, Point, point, pointsWithinPolygon, Polygon, MultiPolygon } from '@turf/turf';
import * as JSZip from 'jszip';
import { Setting } from "./settings";
import { Connection } from "./wss";

/** Utility */
export namespace Util {
    /** Get and return map features */
    export async function GetFeatures() {
        const result_borders: GCFeatureCollection[] = []
        try {
            const response = await fetch(Connection.ExtensionService.Service.Borders, { cache: "no-cache" })
            const blob = await response.blob();
            const loadedZip = await JSZip.loadAsync(blob)

            for (const countryFile of Object.values(loadedZip.files)) {
                try {
                    (async () => {
                        if (!countryFile.name.endsWith(".geojson")) return
                        
                        const content = await countryFile.async("string")
                        try {
                            const json = JSON.parse(content) as GCFeatureCollection
                            result_borders.push(json)
                        }
                        catch (e) {
                            Logger.debug(Debug("Feature parse error:"), Debug(e), Debug(content))
                        }
                    })()
                }
                catch (e) {
                    Logger.error(Msg(e))
                }
            }
        }
        catch (e) {
            Logger.error(Msg(e))
        }

        return result_borders
    }

    /** Get and return flags svg dictionary */
    export async function GetFlags() {
        const svgs = {} as SVGDictionary
        try {
            const response = await fetch(Connection.ExtensionService.Service.Flags, { cache: "no-cache" })
            const blob = await response.blob();
            const loadedZip = await JSZip.loadAsync(blob)
            for (const countryFile of Object.values(loadedZip.files)) {
                try {
                    const content = await countryFile.async("string")
                    let key = countryFile.name.replace(".svg", "").replace("flags/", "");
                    svgs[key] = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(content)))
                }
                catch (e) {
                    Logger.error(Msg(e))
                }
            }
        }
        catch (e) {
            Logger.error(Msg(e))
            return {};
        }

        return svgs
    }

    /** Get ISO data */
    export async function GetISOData(): Promise<ISOData[]> {
        try {
            const isoData = await fetch(Connection.ExtensionService.Service.ISO, { cache: "no-cache" })
            const isoObj = await isoData.json() as ISOData[]

            return isoObj
        }
        catch (e) {
            Logger.error(Msg(e))
            return [];
        }
    }

    function alpha3to2(isos: ISOData[], iso: string)
    {
        return isos.find(country => country.Alpha3 === iso)?.Alpha2
    }

    function getFlagName(isos: ISOData[], feat: Feature<Geometry, GCFeatureProperties>) 
    {
        const group = alpha3to2(isos, feat.properties.shapeGroup)
        if (!Setting.Streamer.borderAdmin) return group
        switch (group) {
            case "US": {
                const isoExists = alpha3to2(isos, feat.properties.shapeISO)

                if (isoExists) return isoExists

                let iso = feat.properties.shapeISO.replace("-", "")
                return iso
            }
            case "CA":
                return feat.properties.shapeISO;
            case "GB":
                return alpha3to2(isos, feat.properties.shapeISO) ?? feat.properties.shapeISO;
            default:
                return alpha3to2(isos, feat.properties.shapeISO) ?? group
        }

    }

    function getCountryNameByISO(isos: ISOData[], iso: string)
    {
        return isos.find(country => country.Alpha2 === iso)?.name
    }

    export async function GetCountry(flags: SVGDictionary,
        allBorders: GCFeatureCollection[],
        isos: ISOData[],
        lat: number,
        lng: number) : Promise<[Nullable<Feature<Polygon | MultiPolygon, GCFeatureProperties> | GCFeatureCollection>, Nullable<string>, Nullable<string>]>
    {
        for (const borders of allBorders) {
            for (const feature of borders.features) {
                let contains: Nullable<FeatureCollection<Point, GCFeatureProperties>> = null

                if (feature?.geometry) {
                    contains = pointsWithinPolygon(point([lng, lat]), feature as Feature<Polygon | MultiPolygon, GCFeatureProperties>)
                }

                if (contains && contains.features.length > 0) {
                    const flagIso = getFlagName(isos, feature as Feature<Polygon | MultiPolygon, GCFeatureProperties>)

                    if (!flagIso) break;

                    const svg = Setting.Streamer.showFlags ? flags[flagIso] : undefined
                    const countryName = getCountryNameByISO(isos, flagIso)
                    if (!Setting.Streamer.borderAdmin) return [borders, svg, countryName]
                    else return [feature as Feature<Polygon | MultiPolygon, GCFeatureProperties>, svg, countryName]
                }
            }
        }
        return [undefined, undefined, undefined]
    }
}
