import "./style.css";

require(["esri/config", "esri/layers/FeatureLayer"], (
  esriConfig,
  FeatureLayer
) => {
  // Authentications
  esriConfig.apiKey = import.meta.env.VITE_ARCGIS_API_KEY;

  const arcgisMap = document.querySelector("arcgis-map");
  arcgisMap.addEventListener("arcgisViewReadyChange", () => {
    // Define a pop-up for Trailheads
    const popupTrailheads = {
      title: "Trailhead",
      content:
        "<b>Trail:</b> {TRL_NAME}<br><b>City:</b> {CITY_JUR}<br><b>Cross Street:</b> {X_STREET}<br><b>Parking:</b> {PARKING}<br><b>Elevation:</b> {ELEV_FT} ft",
    };
    const trailheads = new FeatureLayer({
      url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads_Styled/FeatureServer/0",
      outFields: ["TRL_NAME", "CITY_JUR", "X_STREET", "PARKING", "ELEV_FT"],
      popupTemplate: popupTrailheads,
    });

    arcgisMap.map.add(trailheads);

    // Define a popup for Trails
    const popupTrails = {
      title: "Trail Information",
      content: [
        {
          type: "media",
          mediaInfos: [
            {
              type: "column-chart",
              title: "Trail Elevation",
              value: {
                fields: ["ELEV_MIN", "ELEV_MAX"],
                normalizeField: null,
                tooltipField: "Min and max elevation values",
              },
            },
          ],
        },
      ],
      fieldInfos: [
        {
          fieldName: "ELEV_MIN",
          label: "Elevation Minimum",
          digitSeparator: true,
        },
        {
          fieldName: "ELEV_MAX",
          label: "Elevation Maximum",
          digitSeparator: true,
        },
      ],
    };

    const trails = new FeatureLayer({
      url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails_Styled/FeatureServer/0",
      outFields: ["TRL_NAME", "ELEV_GAIN"],
      popupTemplate: popupTrails,
    });

    arcgisMap.map.add(trails, 0);

    // Define popup for Parks and Open Spaces
    const popupOpenspaces = {
      title: "{PARK_NAME}",
      content: [
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "AGNCY_NAME",
              label: "Agency",
              isEditable: true,
              tooltip: "",
              visible: true,
              format: null,
              stringFieldOption: "text-box",
            },
            {
              fieldName: "TYPE",
              label: "Type",
              isEditable: true,
              tooltip: "",
              visible: true,
              format: null,
              stringFieldOption: "text-box",
            },
            {
              fieldName: "ACCESS_TYP",
              label: "Access",
              isEditable: true,
              tooltip: "",
              visible: true,
              format: null,
              stringFieldOption: "text-box",
            },

            {
              fieldName: "GIS_ACRES",
              label: "Acres",
              isEditable: true,
              tooltip: "",
              visible: true,
              format: {
                places: 2,
                digitSeparator: true,
              },

              stringFieldOption: "text-box",
            },
          ],
        },
      ],
    };

    const openspaces = new FeatureLayer({
      url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Parks_and_Open_Space_Styled/FeatureServer/0",
      outFields: [
        "TYPE",
        "PARK_NAME",
        "AGNCY_NAME",
        "ACCESS_TYP",
        "GIS_ACRES",
        "TRLS_MI",
        "TOTAL_GOOD",
        "TOTAL_FAIR",
        "TOTAL_POOR",
      ],
      popupTemplate: popupOpenspaces,
    });

    arcgisMap.map.add(openspaces, 0);
  });
});
