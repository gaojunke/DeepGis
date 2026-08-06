import type { DeepGisAppAPI, DeepGisPlugin } from "../types";

const CARTO_LIGHT = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export const cartoLightPlugin: DeepGisPlugin = {
  id: "carto-light",
  name: "Carto Light Basemap",
  version: "0.1.0",
  activate: (app: DeepGisAppAPI) => {
    app.setBasemap(CARTO_LIGHT);
  },
  deactivate: () => {},
};
