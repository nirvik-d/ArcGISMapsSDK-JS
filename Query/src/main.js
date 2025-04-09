import "./style.css";

require(["esri/config", "esri/layers/FeatureLayer"], (
  esriConfig,
  FeatureLayer
) => {
  //Authentications
  esriConfig.apiKey = import.meta.env.VITE_ARCGIS_API_KEY;

  const arcgisMap = document.querySelector("arcgis-map");
  const arcgisSketch = document.querySelector("arcgis-sketch");
  const queryTypeSelect = document.querySelector("#queryTypeSelect");
  const selectFilter = document.querySelector("#sqlSelect");
  const defaultOption = document.querySelector("#defaultOption");

  let whereClause = defaultOption.value;

  let parcelLayer = new FeatureLayer({
    url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/LA_County_Parcels/FeatureServer/0",
  });

  arcgisMap.addEventListener("arcgisViewReadyChange", () => {
    selectFilter.addEventListener("calciteSelectChange", (event) => {
      if (queryTypeSelect.value === "sql") {
        runQuery(queryTypeSelect.value, event, parcelLayer, arcgisMap.extent);
      } else if (queryTypeSelect.value === "spatial") {
        arcgisSketch.addEventListener("update", (event) => {
          if (event.detail.state === "start") {
            runQuery(
              queryTypeSelect.value,
              event,
              parcelLayer,
              event.detail.graphics[0].geometry
            );
          }
          if (event.detail.state === "complete") {
            arcgisSketch.layer.remove(event.detail.graphics[0]);
          }
          if (
            event.detail.toolEventInfo &&
            (event.detail.toolEventInfo.type === "scale-stop" ||
              event.detail.toolEventInfo.type === "reshape-stop" ||
              event.detail.toolEventInfo.type === "move-stop")
          ) {
            runQuery(
              queryTypeSelect.value,
              event,
              parcelLayer,
              event.detail.graphics[0].geometry
            );
          }
        });
      } else if (queryTypeSelect.value === "filter") {
        parcelLayer = new FeatureLayer({
          url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/LA_County_Parcels/FeatureServer/0",
          outFields: ["*"],
          popupTemplate: {
            title: "{UseType}",
            content:
              "Description: {UseDescription}. Land value: {Roll_LandValue}",
          },
          definitionExpression: "1=0",
        });
        arcgisMap.map.add(parcelLayer);
        setFeatureLayerFilter(event.target.value, parcelLayer);
      }
    });
  });

  function runQuery(queryType, event, parcelLayer, geometry) {
    switch (queryType) {
      case "sql":
        whereClause = event.target.value;
        queryFeatureLayerSQL(parcelLayer, geometry);
        break;
      case "spatial":
        queryFeatureLayerSpatial(parcelLayer, geometry);
        break;
      default:
        return;
    }
  }

  function queryFeatureLayerSQL(parcelLayer, geometry) {
    const parcelQuery = {
      where: whereClause,
      spatialRelationship: "intersects",
      geometry: geometry,
      outFields: ["APN", "UseType", "TaxRateCity", "Roll_LandValue"],
      returnGeometry: true,
    };
    parcelLayer
      .queryFeatures(parcelQuery)
      .then((results) => {
        displayResults(results);
      })
      .catch((error) => {
        console.log(error.error);
      });
  }

  function queryFeatureLayerSpatial(extent, parcelLayer) {
    console.log("Querying parcels...");

    const parcelQuery = {
      spatialRelationship: "intersects",
      geometry: extent,
      outFields: ["APN", "UseType", "TaxRateCity", "Roll_LandValue"],
      returnGeometry: true,
    };

    parcelLayer
      .queryFeatures(parcelQuery)
      .then((results) => {
        displayResults(results);
      })
      .catch((error) => {
        console.log(error.error);
      });
  }

  function displayResults(results) {
    const symbol = {
      type: "simple-fill",
      color: [20, 130, 200, 0.5],
      outline: {
        color: "white",
        width: 0.5,
      },
    };

    const popupTemplate = {
      title: "Parcel {APN}",
      content:
        "Type: {UseType} <br> Land value: {Roll_LandValue} <br> Tax Rate City: {TaxRateCity}",
    };

    // Styles
    results.features.map((feature) => {
      feature.symbol = symbol;
      feature.popupTemplate = popupTemplate;
      return feature;
    });

    arcgisMap.closePopup();
    arcgisMap.graphics.removeAll();
    arcgisMap.graphics.addMany(results.features);
  }

  // Server-side filter
  function setFeatureLayerFilter(expression, featureLayer) {
    featureLayer.definitionExpression = expression;
  }
});
