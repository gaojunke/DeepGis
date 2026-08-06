import { DEFAULT_LAYER_STYLE, type DeepGisLayer } from "@geolibre/core";

/**
 * Minimal in-memory GeoJSON layer for store/project tests.
 *
 * Shared so the required `DeepGisLayer` fields live in one place — several
 * suites build the same skeleton and would otherwise drift apart whenever the
 * type gains a required field.
 */
export function geojsonLayer(patch: Partial<DeepGisLayer> = {}): DeepGisLayer {
  return {
    id: "layer-a",
    name: "Layer A",
    type: "geojson",
    source: { type: "geojson" },
    visible: true,
    opacity: 1,
    style: { ...DEFAULT_LAYER_STYLE },
    metadata: {},
    geojson: { type: "FeatureCollection", features: [] },
    ...patch,
  };
}
