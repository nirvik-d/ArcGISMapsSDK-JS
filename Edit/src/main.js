import "./style.css";

require(["esri/config", "esri/layers/FeatureLayer"], (
  esriConfig,
  FeatureLayer
) => {
  esriConfig.apiKey = import.meta.env.VITE_ARCGIS_API_KEY;

  const arcgisMap = document.querySelector("arcgis-map");
  arcgisMap.addEventListener("arcgisViewReadyChange", () => {
    // Add feature layer (points)
    const myPointsFeatureLayer = new FeatureLayer({
      url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/my_points/FeatureServer/0",
    });

    arcgisMap.map.add(myPointsFeatureLayer);
  });
});
