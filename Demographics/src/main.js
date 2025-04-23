import "./style.css";

require([
  "esri/config",
  "esri/geometry/operators/geodesicBufferOperator",
  "esri/Graphic",
  "esri/rest/locator",
  "esri/symbols/SimpleFillSymbol",
], (esriConfig, geodesicBufferOperator, Graphic, locator, SimpleFillSymbol) => {
  const authentication = arcgisRest.ApiKeyManager.fromKey(esriConfig.apiKey);

  const arcgisSearch = document.querySelector("arcgis-search");
  arcgisSearch.addEventListener("arcgisSearchResult", async (event) => {
    if (!event.detail.result) return;
    getDemographicData(event.detail.result.name, event.detail.feature.geometry);
  });

  const arcgisMap = document.querySelector("arcgis-map");
  arcgisMap.addEventListener("arcgisViewClick", async (event) => {
    const params = {
      location: event.detail.mapPoint,
      outFields: "*",
    };

    const serverUrl =
      "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

    const address = await locator.locationToAddress(serverUrl, params);

    try {
      const city = address.attributes.Name || address.attributes.Region;
      getDemographicData(city, params.location);
    } catch (error) {
      arcgisMap.Graphics.removeAll();
      console.log(error);
    }
  });

  if (!arcgisMap.ready) {
    arcgisMap.addEventListener(
      "arcgisViewClick",
      () => {
        getDemographicData("Milan", arcgisMap.center);
      },
      { once: true }
    );
  } else {
    getDemographicData("Milan", arcgisMap.center);
  }

  async function getDemographicData(city, point) {
    const demographicData = await arcgisRest.queryDemographicData({
      studyAreas: {
        geometry: {
          x: point.longitude,
          y: point.latitude,
        },
      },
      authentication: authentication,
    });

    if (!demographicData || demographicData.results.length == 0) {
      return;
    }
    if (
      demographicData.results[0].value.FeatureSet.length > 0 &&
      demographicData.results[0].value.FeatureSet[0].features.length > 0
    ) {
      const attributes =
        demographicData.result[0].value.FeatureSet[0].features[0].attributes;
      showData(city, point, attributes);
    }
  }

  async function showData(city, point, attributes) {
    if (!city || !point || !attributes) {
      return;
    }
    arcgisMap.popup.dockOptions = {
      buttonEnabled: false,
    };
    arcgisMap.popup.visibleElements = {
      collapseButton: false,
    };

    const title = `Global facts near ${city}`;
    const content = `Population: ${attributes.TOTPOP}<br>Total Males: ${attributes.TOTMALES}<br>Total Females: ${attributes.TOTFEMALES}<br>Average Household Size: ${attributes.AVGHHSZ}`;

    arcgisMap.openPopup({
      location: point,
      title: title,
      content: content,
    });

    await geodesicBufferOperator.load();
    const buffer = geodesicBufferOperator.execute(point, 1, {
      unit: "miles",
    });

    const bufferGraphic = new Graphic({
      geometry: buffer,
      symbol: new SimpleFillSymbol({
        color: [50, 50, 50, 0.1],
        outline: {
          color: [0, 0, 0, 0.25],
          width: 0.5,
        },
      }),
    });

    arcgisMap.graphics.removeAll();
    arcgisMap.graphics.add(bufferGraphic);
  }
});
