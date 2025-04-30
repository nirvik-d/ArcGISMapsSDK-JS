import "./style.css";

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/rest/places",
  "esri/rest/support/FetchPlaceParameters",
  "esri/rest/support/PlacesQueryParameters",
  "esri/geometry/Circle",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
], (
  Map,
  MapView,
  places,
  FetchPlaceParameters,
  PlacesQueryParameters,
  Circle,
  Graphic,
  GraphicsLayer
) => {
  let infoPanel; // Info panel for place information
  let clickPoint; // Clicked point on the map
  let activeCategory = "4d4b7105d754a06377d81259"; // Landmarks and Outdoors category

  // GraphicsLayer for places features
  const placesLayer = new GraphicsLayer({
    id: "placesLayer",
  });
  // GraphicsLayer for map buffer
  const bufferLayer = new GraphicsLayer({
    id: "bufferLayer",
  });

  // Info panel interactions
  const categorySelect = document.getElementById("categorySelect");
  const resultPanel = document.getElementById("results");
  const flow = document.getElementById("flow");

  // Map with the GraphicsLayers
  const map = new Map({
    basemap: "arcgis/navigation",
    layers: [bufferLayer, placesLayer],
  });

  // View centered around Venice Beach, CA
  const view = new MapView({
    map: map,
    center: [-118.46651, 33.98621],
    zoom: 13,
    container: "viewDiv",
  });

  // Clear graphics and results from the previous place search
  function clearGraphics() {
    bufferLayer.removeAll(); // Remove graphics from GraphicsLayer of previous buffer
    placesLayer.removeAll(); // Remove graphics from GraphicsLayer of previous places search
    resultPanel.innerHTML = "";
    if (infoPanel) infoPanel.remove();
  }

  // View on-click event to capture places search location
  view.on("click", (event) => {
    clearGraphics();
    clickPoint = event.mapPoint;
    // Pass point to the showPlaces() function
    clickPoint && showPlaces(clickPoint);
  });

  // Event listener for category changes
  categorySelect.addEventListener("calciteComboboxChange", () => {
    activeCategory = categorySelect.value;
    clearGraphics();
    // Pass point to the showPlaces() function with new category value
    clickPoint && showPlaces(clickPoint);
  });

  // Display map click search area and pass to places service
  async function showPlaces(placePoint) {
    // Buffer graphic represents click location and search radius
    const circleGeometry = new Circle({
      center: placePoint,
      geodesic: true,
      numberOfPoints: 100,
      radius: 500, // set radius to 500 meters
      radiusUnit: "meters",
    });
    const circleGraphic = new Graphic({
      geometry: circleGeometry,
      symbol: {
        type: "simple-fill", // autocasts as SimpleFillSymbol
        style: "solid",
        color: [3, 140, 255, 0.1],
        outline: {
          width: 1,
          color: [3, 140, 255],
        },
      },
    });
    // Add buffer graphic to the view
    bufferLayer.graphics.add(circleGraphic);
    // Parameters for queryPlacesNearPoint()
    const placesQueryParameters = new PlacesQueryParameters({
      categoryIds: [activeCategory],
      radius: 500, // set radius to 500 meters
      point: placePoint,
      icon: "png",
    });
    // The results variable represents the PlacesQueryResult
    const results = await places.queryPlacesNearPoint(placesQueryParameters);
    // Pass the PlacesQueryResult to the tabulatePlaces() function
    tabulatePlaces(results);
  }

  // Investigate the individual PlaceResults from the array of results
  // from the PlacesQueryResult and process them
  function tabulatePlaces(results) {
    results.results.forEach((placeResult) => {
      // Pass each result to the addResult() function
      addResult(placeResult);
    });
  }

  // Visualize the places on the map based on category
  // and list them on the info panel with more details
  async function addResult(place) {
    const placeGraphic = new Graphic({
      geometry: place.location,
      symbol: {
        type: "picture-marker",
        url: place.icon.url,
        width: 15,
        height: 15,
      },
    });
    // Add each graphic to the GraphicsLayer
    placesLayer.graphics.add(placeGraphic);
    const infoDiv = document.createElement("calcite-list-item");
    infoDiv.label = place.name;
    infoDiv.description = `
  ${place.categories[0].label} -
  ${Number((place.distance / 1000).toFixed(1))} km`;
    // If a place in the info panel is clicked
    // then open the feature's popup
    infoDiv.addEventListener("click", async () => {
      view.openPopup({
        location: place.location,
        title: place.name,
      });
      // Move the view to center on the selected place feature
      view.goTo(placeGraphic);
      // Fetch more details about each place based
      // on the place ID with all possible fields
      const fetchPlaceParameters = new FetchPlaceParameters({
        placeId: place.placeId,
        requestedFields: ["all"],
      });
      // Pass the FetchPlaceParameters and the location of the
      // selected place feature to the getDetails() function
      getDetails(fetchPlaceParameters, place.location);
    });
    resultPanel.appendChild(infoDiv);
  }

  // Get place details and display in the info panel
  async function getDetails(fetchPlaceParameters, placePoint) {
    // Get place details
    const result = await places.fetchPlace(fetchPlaceParameters);
    const placeDetails = result.placeDetails;
    // Set-up panel on the info for more place information
    infoPanel = document.createElement("calcite-flow-item");
    flow.append(infoPanel);
    infoPanel.heading = placeDetails.name;
    infoPanel.description = placeDetails.categories[0].label;
    const flowItems = flow.querySelectorAll("calcite-flow-item");
    // remove selection from other flow items
    flowItems.forEach((item) => (item.selected = false));
    // set current flow item to selected
    infoPanel.selected = true;
    // Pass attributes from each place to the setAttribute() function
    setAttribute("Address", "map-pin", placeDetails.address.streetAddress);
    setAttribute("Phone", "mobile", placeDetails.contactInfo.telephone);
    setAttribute("Email", "email-address", placeDetails.contactInfo.email);
    setAttribute(
      "Facebook",
      "speech-bubble-social",
      placeDetails.socialMedia.facebookId
        ? `www.facebook.com/${placeDetails.socialMedia.facebookId}`
        : null
    );
    setAttribute(
      "X",
      "speech-bubbles",
      placeDetails.socialMedia.twitter
        ? `www.x.com/${placeDetails.socialMedia.twitter}`
        : null
    );
    setAttribute(
      "Instagram",
      "camera",
      placeDetails.socialMedia.instagram
        ? `www.instagram.com/${placeDetails.socialMedia.instagram}`
        : null
    );
    // If another place is clicked in the info panel, then close
    // the popup and remove the infoPanel
    infoPanel.addEventListener("calciteFlowItemBack", async () => {
      view.closePopup();
      infoPanel.remove();
    });
  }

  // Take each place attribute and display on info panel
  function setAttribute(heading, icon, validValue) {
    if (validValue) {
      const element = document.createElement("calcite-block");
      element.heading = heading;
      element.description = validValue;
      const attributeIcon = document.createElement("calcite-icon");
      attributeIcon.icon = icon;
      attributeIcon.slot = "icon";
      attributeIcon.scale = "m";
      element.appendChild(attributeIcon);
      infoPanel.appendChild(element);
    }
  }
});
