import "./style.css";

require([
  "esri/config",
  "esri/Graphic",
  "esri/rest/locator",
  "esri/Map",
  "esri/views/MapView",
  "esri/core/reactiveUtils",
], (esriConfig, Graphic, locator, Map, MapView, reactiveUtils) => {
  esriConfig.apiKey = import.meta.env.VITE_ARCGIS_API_KEY;

  const map = new Map({
    basemap: "arcgis/navigation",
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [18.9553, 69.6492], //Longitude, latitude
    zoom: 13,
  });

  // // Get a reference to the locate component
  // const locate = document.querySelector("arcgis-locate");
  // locate.goToOverride = (view, options) => {
  //   options.target.scale = 1500;
  //   return view.goTo(options.target);
  // };

  // const track = document.querySelector("arcgis-track");
  // track.Graphic = new Graphic({
  //   symbol: {
  //     type: "simple-marker",
  //     size: "12-px",
  //     color: "green",
  //     outline: {
  //       color: "#efefef",
  //       width: "1.5px",
  //     },
  //   },
  // });

  const serviceUrl =
    "http://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

  // // Reverse Geocoding
  // const arcgisMap = document.querySelector("arcgis-map");
  // arcgisMap.addEventListener("arcgisViewReadyChange", () => {
  //   arcgisMap.addEventListener("arcgisViewClick", (event) => {
  //     const params = {
  //       location: event.detail.mapPoint,
  //     };

  //     locator
  //       .locationToAddress(serviceUrl, params)
  //       .then((response) => {
  //         const address = response.address;
  //         showAddress(address, event.detail.mapPoint);
  //       })
  //       .catch(() => {
  //         showAddress("No address found", event.detail.mapPoint);
  //       });
  //   });
  // });

  // function showAddress(address, pt) {
  //   arcgisMap.openPopup({
  //     title:
  //       +Math.round(pt.longitude * 100000) / 100000 +
  //       ", " +
  //       Math.round(pt.latitude * 100000) / 100000,
  //     content: address,
  //     location: pt,
  //   });
  // }

  // Find places.
  const places = [
    "Choose a place type...",
    "Parks and Outdoors",
    "Coffee shop",
    "Gas station",
    "Food",
    "Hotel",
  ];

  const select = document.createElement("select");
  select.setAttribute("class", "esri-widget esri-select");
  select.setAttribute(
    "style",
    "width: 175px; font-family: 'Avenir Next W00'; font-size: 1em"
  );

  places.forEach((p) => {
    const option = document.createElement("option");
    option.value = p;
    option.innerHTML = p;
    select.appendChild(option);
  });

  view.ui.add(select, "top-right");

  function findPlaces(category, pt) {
    locator
      .addressToLocations(serviceUrl, {
        location: pt,
        categories: [category],
        maxLocations: 25,
        outFields: ["Place_addr", "PlaceName"],
      })
      .then((results) => {
        view.closePopup();
        view.graphics.removeAll();

        results.forEach((result) => {
          view.graphics.add(
            new Graphic({
              attributes: result.attributes, // Data attributes returned
              geometry: result.location, // Point returned
              symbol: {
                type: "simple-marker",
                color: "#000000",
                size: "12px",
                outline: {
                  color: "#ffffff",
                  width: "2px",
                },
              },

              popupTemplate: {
                title: "{PlaceName}", // Data attribute names
                content: "{Place_addr}",
              },
            })
          );
        });
      });
  }
  // Search for places in center of map
  reactiveUtils.when(
    () => view.stationary,
    () => {
      findPlaces(select.value, view.center);
    }
  );

  // Listen for category changes and find places
  select.addEventListener("change", (event) => {
    findPlaces(event.target.value, view.center);
  });
});
