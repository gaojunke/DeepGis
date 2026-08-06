import type { DeepGisAppAPI, DeepGisMapControlPosition, DeepGisPlugin } from "../types";

let layerControlPosition: DeepGisMapControlPosition = "top-right";

export const maplibreLayerControlPlugin: DeepGisPlugin = {
  id: "maplibre-layer-control",
  name: "Layer Control",
  version: "0.16.0",
  activeByDefault: true,
  activate: (app: DeepGisAppAPI) => app.setBuiltInMapControlVisible("layer-control", true),
  deactivate: (app: DeepGisAppAPI) => {
    app.setBuiltInMapControlVisible("layer-control", false);
  },
  getMapControlPosition: () => layerControlPosition,
  setMapControlPosition: (app: DeepGisAppAPI, position: DeepGisMapControlPosition) => {
    layerControlPosition = position;
    return app.setBuiltInMapControlPosition("layer-control", position);
  },
};
