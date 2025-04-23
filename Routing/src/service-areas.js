require([
  "esri/rest/serviceArea",
  "esri/rest/support/ServiceAreaParameters",
  "esri/rest/support/FeatureSet",
  "esri/Graphic",
], (serviceArea, ServiceAreaParams, FeatureSet, Graphic) => {
  const arcgisMap = document.querySelector("arcgis-map");

  arcgisMap.addEventListener("arcgisViewReadyChange", () => {
    const serviceAreaUrl =
      "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World/solveServiceArea";

    arcgisMap.addEventListener("arcgisViewClick", (event) => {
      const locationGraphic = createGraphic(event.detail.mapPoint);
      const driveTimeCutoffs = [5, 10, 15]; // Minutes
      const serviceAreaParams = createServiceAreaParams(
        locationGraphic,
        driveTimeCutoffs,
        arcgisMap.spatialReference
      );

      solveServiceArea(serviceAreaUrl, serviceAreaParams);
    });
  });

  // Create the location graphic
  function createGraphic(point) {
    arcgisMap.graphics.removeAll();
    const graphic = new Graphic({
      geometry: point,
      symbol: {
        type: "simple-marker",
        color: "white",
        size: 8,
      },
    });

    arcgisMap.graphics.add(graphic);
    return graphic;
  }

  function createServiceAreaParams(
    locationGraphic,
    driveTimeCutoffs,
    outSpatialReference
  ) {
    // Create one or more locations (facilities) to solve for
    const featureSet = new FeatureSet({
      features: [locationGraphic],
    });

    // Set all of the input parameters for the service
    const taskParameters = new ServiceAreaParams({
      facilities: featureSet,
      defaultBreaks: driveTimeCutoffs,
      trimOuterPolygon: true,
      outSpatialReference: outSpatialReference,
    });
    return taskParameters;
  }

  function solveServiceArea(url, serviceAreaParams) {
    return serviceArea.solve(url, serviceAreaParams).then(
      (result) => {
        if (result.serviceAreaPolygons.features.length) {
          // Draw each service area polygon
          result.serviceAreaPolygons.features.forEach((graphic) => {
            graphic.symbol = {
              type: "simple-fill",
              color: "rgba(255,50,50,.25)",
            };
            arcgisMap.graphics.add(graphic, 0);
          });
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }
});
