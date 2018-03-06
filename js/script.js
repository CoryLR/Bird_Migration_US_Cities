// Cory Leigh Rahman
// Junco vs Tanager: Journey Through Urban America
// Tools used: Leaflet, jQuery, Bootstrap
// This JavaScript file contains ALL custom javascript code for the "mapp" (map-app)

// MAIN function, everything starts here
function main() {

    // Detect window width for optimum default zoom level on start & resize
    if ($(window).width() > 1200) {
        var defaultZoom = 5;
    } else {
        var defaultZoom = 4;
    };
    $(window).resize(function () {
        if ($(window).width() > 1200) {
            defaultZoom = 5
        } else {
            defaultZoom = 4
        };
    });

    // Map Bounds function for map initialization
    function leafletBounds(N, S, E, W) {
        var southWest = L.latLng(S, W);
        var northEast = L.latLng(N, E);
        return L.latLngBounds(southWest, northEast);
    };

    // Initialize Leaflet map
    var mymap = L.map('map', {
        minZoom: 4,
        maxZoom: 14,
        maxBounds: leafletBounds(60, 0, -30, -160),
    });
    mymap.setView([40, -97], defaultZoom);

    // Add basemap to map
    var Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Data: <a href="https://ebird.org/">eBird</a> (2012-2016) |  Illustrations &copy; <a href="http://www.sibleyguides.com/">David Allen Sibley</a> | Tiles &copy; Esri | <a id="aboutMap">About Map <span class="glyphicon glyphicon-info-sign"></span></a>',
        maxZoom: 16
    }).addTo(mymap);

    // Loads hotspot layer from geojson, handles symbology & popups
    getHotspotData(mymap);

    // Loads the bird timeseries layer from geojson
    // Creates proportional symbols for both juncos and tanagers
    // Creates sequence controls for the timeseries
    // Creates the Explore City controls
    getBirdData(mymap);

    // Displays the appropriate layer according to zoom level
    handleLayerZoomDisplay(mymap)

    // Makes the buttons work which open and close the About Map splash page
    createAboutMapListeners()
};

function getHotspotData(map) {

    //Connect to layer via AJAX
    $.ajax("geojson/UrbanHotspots_top363.geojson", {
        dataType: "json",
        success: function (response) {

            // Styling for symbology below
            function getColor(d) {
                return d > 2 ? '#756bb1' :
                    d > 1 ? '#bcbddc' :
                    '#efedf5';
            };

            function hotSpotStyle(feature) {
                return {
                    radius: 12,
                    fillColor: getColor(feature.properties.Popularity),
                    color: "black",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 1,
                    className: "hotspots"
                };
            };

            //Creates the symbology & popups using functions above in this function
            L.geoJson(response, {
                pointToLayer: function (feature, latlng) {
                    var circleMarkers = L.circleMarker(latlng, hotSpotStyle(feature));
                    //build popup content string
                    var popupContent = "<div>" + feature.properties.HOTSPOT + "<br><strong>" + feature.properties.CITY + "</strong><br><a href='https://ebird.org/hotspots?hs=" + feature.properties.LOCALITY_I + "' target='_blank'>View on eBird</a></div>";

                    //bind the popup to the circle marker
                    circleMarkers.bindPopup(popupContent);
                    return circleMarkers
                }
            }).addTo(map);

            // Hides the layer on initial load, it will appear when zoomed in because of the custom zoom controls
            $(".hotspots").hide();

        }
    });
};

// Timeseries layer, symbology, sequence controls, explore city controls
function getBirdData(map) {
    //load the data
    $.ajax("geojson/Timeseries_JT4.geojson", {
        dataType: "json",
        success: function (response) {

            // Format some data for easier use below
            var juncoAttributes = processData(response, "JNC");
            var tanagerAttributes = processData(response, "TAN");
            var cities = getCityZoomLevels(map, response);

            // Workaround for Leaflet's "prevent propagation" limitation in popups
            // Used to assist the "Explore City" button in the city popups
            glbl_cities = cities;

            // Creates proportional symbols for both juncos and tanagers
            createPropSymbols(response, map, juncoAttributes, cities);
            createPropSymbols(response, map, tanagerAttributes, cities);

            // Creates sequence controls for the timeseries
            createSequenceControls(map, juncoAttributes);

            // Creates the Explore City controls
            createExploreCityControls(map, cities);

        }
    });
};

// Format data for createPropData
// Returns the timeseries fields in custom order (October first)
function processData(data, species) {
    //empty arrays to hold attributes
    var attributes = [];
    var attributes_customOrder = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties) {
        //only take attributes with population values
        //OptionsL JNC, TAN
        if (attribute.indexOf(species) > -1) {
            attributes.push(attribute);
        };
    };

    // Reorder the months for optimal migration viewing
    for (var i = 9; i < 12; i++) {
        attributes_customOrder.push(attributes[i])
    };
    for (var i = 0; i < 9; i++) {
        attributes_customOrder.push(attributes[i])
    };
    if (species == "JNC") {
        attributes_customOrder.push(["J_TOTAL", "#0570b0", "#0570b0"])
    } else {
        attributes_customOrder.push(["T_TOTAL", "red", "red"])
    };
    return attributes_customOrder;
};

// Formats all the city names and bounds for Explore City functionality
function getCityZoomLevels(map, data) {
    cities = [];

    // For each city:
    for (i in data.features) {
        // Get city name and coordinates
        var cityName = data.features[i].properties.NAME;
        var cityX = data.features[i].geometry.coordinates[0];
        var cityY = data.features[i].geometry.coordinates[1];

        // Create bounds for the city based on its coordinates
        var southWest = L.latLng(cityY - 0.2, cityX - 0.2);
        var northEast = L.latLng(cityY + 0.2, cityX + 0.2);
        var cityBounds = L.latLngBounds(southWest, northEast);

        // Add the city info to the return val
        cities.push([cityName, cityBounds]);
    };

    // Returns 2d array with all the city names and bounds
    return cities
};

// Gets run twice, once for Juncos and again for Tanagers
function createPropSymbols(data, map, attributes, cities) {

    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng, map, cities) {
            return pointToLayer(feature, latlng, attributes, map, cities);
        }
    }).addTo(map);
};

// Turns markers into the proportional symbols
function pointToLayer(feature, latlng, attributes, map, cities) {

    // starting position on timeslider, options 1-12
    // Have to update static initial month text if changed from 1
    timeSliderStartingPosition = 1

    // Prep variables for creating proportional symbols
    var attribute = attributes[timeSliderStartingPosition - 1];
    var classNameString = "propSymbols " + attributes[12][0]

    //create marker options
    var geojsonMarkerOptions = {
        radius: 0,
        fillColor: attributes[12][1],
        color: attributes[12][2],
        //        fillColor: "#0570b0",
        //        color: "#0570b0",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.05,
        className: classNameString
    };


    // For each feature, determine its value for the selected attribute
    // The value and total get mathed later to determine % of annual bird sightings
    var attValue = Number(feature.properties[attribute]);
    var attTotal = Number(feature.properties[attributes[12][0]]);


    // Give each feature's circle marker a radius based on its attribute value
    geojsonMarkerOptions.radius = calcPropRadius(attValue, attTotal);

    // Create the circle markers
    var layer = L.circleMarker(latlng, geojsonMarkerOptions);

    // Variables for the popup content
    var currentCity = feature.properties.NAME;
    juncoMonthString = "JNC" + attributes[0].substr(3);
    tanagerMonthString = "TAN" + attributes[0].substr(3);
    juncoMonthVal = calcPropValue(feature.properties[juncoMonthString], feature.properties.J_TOTAL)
    tanagerMonthVal = calcPropValue(feature.properties[tanagerMonthString], feature.properties.T_TOTAL)

    // Build the popup content string
    var popupContent = "<div class='currentCity'><strong>" + currentCity + "</strong> (" + attributes[0].substr(7) + ")</div>Juncos: " + juncoMonthVal + "<br>Tanagers: " + tanagerMonthVal + "<br><div id='explorePopupButtonWrapper'><button class='explorePopupButton btn' onclick='exploreCityRelay(" + '"' + currentCity + '"' + ")'>Explore City</button></div>";

    // Bind popup to the circle marker
    layer.bindPopup(popupContent);


    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};


// Calculate the radius of each proportional symbol
function calcPropRadius(attValue, attTotal) {


    // Find the month's percentage of annual sightings
    var monthPercent = (attValue / attTotal) * 100;

    // Scale factor to adjust symbol size evenly
    var scaleFactor = 1.33;

    // Make symbol radius, capped at 40% (Everything about 40% represented by largest symbol)
    var radius = (monthPercent > 40 ? 40 : monthPercent) * scaleFactor

    // Return the appropriate radius, as long as there is sufficient data for the city
    // Fixes math issue where lowdata cities returned a radius of 100
    return (attTotal == 1 || attTotal == 2) ? 1 : radius;
};

// Used to display the appropriate values in popups
function calcPropValue(attValue, attTotal) {

    // Determine value
    var monthPercent = (attValue / attTotal) * 100;
    var value = monthPercent

    // Filter low data, return formatted value
    if (attTotal == 1 || attTotal == 2 || value < 1) {
        returnValue = "0% / Low Data"
    } else {
        returnValue = value.toFixed(1) + "%"
    };
    return returnValue
};

// Creates the sequence controls for the timeseries, 
function createSequenceControls(map, attributes) {

    // Create DOM elements

    // Play and step buttons
    $('#timeSliderWrapper').append('<button class="btn glyphicon glyphicon-play" id="play" title="Play"></button>');
    $('#timeSliderWrapper').append('<button class="btn glyphicon glyphicon-stop" id="stop" title="Stop"></button>');
    $('#timeSliderWrapper').append('<button class="skip btn glyphicon glyphicon-step-backward" id="reverse" title="Step backward"></button>');

    // create range input element
    $('#timeSliderWrapper').append('<div id="range-slider-wrapper"><input id="range-slider" type="range"></div>');

    // range slider buttons
    $('#timeSliderWrapper').append('<button class="skip btn glyphicon glyphicon-step-forward" id="forward" title="Step forward"></button>');

    // Month indicator
    $('#timeSliderWrapper').append('<div class="" id="monthIndicator">OCT</div>');

    // Set slider attributes
    $('#range-slider').attr({
        max: 11,
        min: 0,
        value: 0,
        step: 1
    });

    // Creates the play functionality, "play" button listener
    var currentPlay = [];
    $('#play').click(function () {

        // 10 minute loop
        var playLoops = 100;
        var playSpeed = 500;

        // Auto-step functionality
        var i2 = $('#range-slider').val()
        var iterations = playLoops * 12
        for (var i = 0; i < iterations; i++) {
            currentPlay[i] = setTimeout(function () {
                i2++
                if (i2 > 11) {
                    i2 = 0
                };

                // Update slider
                $('#range-slider').val(i2);

                // Update symbol sizes
                updatePropSymbols(map, attributes[i2]);

                // Update month indicator
                $('#monthIndicator').html("<span>" + attributes[i2].substr(7) + "</span>");
                $('#legendMonth').html(attributes[i2].substr(7));

            }, (i + 1) * playSpeed);
        };

        $('#play').hide();
        $('#stop').show();
    });

    // Creates stop functionality, "stop" listener
    $('#stop, .skip').click(function () {
        for (val in currentPlay) {
            try {
                clearTimeout(currentPlay[val])
            } catch (err) {}
        };
        $('#stop').hide();
        $('#play').show();
    });

    // Skip functionality, skip click listener
    $('.skip').click(function () {
        //get the old index value
        var index = $('#range-slider').val();

        // Increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward') {
            index++;
            // If past the last attribute, wrap around to first attribute
            index = index > 11 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse') {
            index--;
            // If past the first attribute, wrap around to last attribute
            index = index < 0 ? 11 : index;
        };

        // Update slider
        $('#range-slider').val(index);

        // Update symbol sizes
        updatePropSymbols(map, attributes[index]);

        // Update month indicator
        $('#monthIndicator').html("<span>" + attributes[index].substr(7) + "</span>");
        $('#legendMonth').html(attributes[index].substr(7));
    });

    // Input listener for slider
    $('#range-slider').on('input', function () {
        //Step 6: get the new index value
        var index = $(this).val();

        // Update symbol sizes
        updatePropSymbols(map, attributes[index]);

        // Update month indicator
        $('#monthIndicator').html("<span>" + attributes[index].substr(7) + "</span>");
        $('#legendMonth').html(attributes[index].substr(7));
    });
};



// Updates the proportional symbols when called
// Called by all listeners which skip months
function updatePropSymbols(map, attribute) {
    map.eachLayer(function (layer) {

        //access feature properties
        if (layer.feature && layer.feature.properties[attribute]) {
            var props = layer.feature.properties;
            if (layer.defaultOptions.className.indexOf("J_TOTAL") > -1) {
                var currentTotal = "J_TOTAL";
                var month = attribute
            } else {
                var currentTotal = "T_TOTAL"
                var month = "TAN" + attribute.substr(3)
            };

            // Update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[month], props[currentTotal]);
            layer.setRadius(radius);

            // Popup string helpers
            var currentCity = layer.feature.properties.NAME;
            juncoMonthString = attribute;
            tanagerMonthString = "TAN" + attribute.substr(3);
            juncoMonthVal = calcPropValue(layer.feature.properties[juncoMonthString], layer.feature.properties.J_TOTAL)
            tanagerMonthVal = calcPropValue(layer.feature.properties[tanagerMonthString], layer.feature.properties.T_TOTAL)

            // Build popup content string
            var popupContent = "<div class='currentCity'><strong>" + currentCity + "</strong> (" + attribute.substr(7) + ")</div>Juncos: " + juncoMonthVal + "<br>Tanagers: " + tanagerMonthVal + "<br><div id='explorePopupButtonWrapper'><button class='explorePopupButton btn' onclick='exploreCityRelay(" + '"' + currentCity + '"' + ")'>Explore City</button></div>";

            // Bind the popup to the circle marker
            layer.bindPopup(popupContent);

        };
    });
};

// Initialize city tracker, global var
// Workaround because Leaflet blocks listeners on their popups
var exploreCityTracker = null;

// Works with glbl var above to pass the appropriate city name for Explore City popup button
function exploreCityRelay(cityName) {
    exploreCityTracker = cityName
};

// Creates the controls and listeners for the Explore City dropup menu and buttons
function createExploreCityControls(map, cities) {

    // Workaround for the Leaflet issue which blocks listeners on their popups
    // Listens for any click on HTML, but only activates if the Explore City popup button was pressed, triggering the onclick='' in the DOM
    $("html").click(function () {
        if (exploreCityTracker != null) {
            var city;
            for (var i = 0, len = cities.length; i < len; i++) {
                if (cities[i][0] === exploreCityTracker) {
                    city = cities[i];
                    break;
                }
            };
            $(".propSymbols").hide();
            map.flyToBounds(city[1], {
                duration: 0.6,
            })
        };
        // Reset the tracker so that future html clicks don't activate city zoom
        exploreCityTracker = null
    });


    // Create the dropup menu items for the Explore a City operator
    for (i in cities) {
        $("#cityList").append('<li class="dropdown-item cityListItem" cityIndex="' + i + '">' + cities[i][0] + '</li>')
    };
    $("#cityList").append('<li role="separator" class="divider"></li>')
    $("#cityList").append('<li class="dropdown-item cityListItem">Want to explore more? Visit the <a href="https://www.ebird.org/hotspots" target="_blank">eBird Hotspot Map</a></li>')

    // Clicking any city list item will zoom to the appropriate city
    $("#cityList li").click(function () {
        if (true) {
            var city = $(this).attr("cityIndex");
            $(".propSymbols").hide();
            map.flyToBounds(cities[city][1], {
                duration: 0.6,
            })
        };
    });

};

// Shows & hides layers & UI depending on current zoom level
function handleLayerZoomDisplay(map) {

    map.on('zoomend', function () {
        points = map.layer;
        if (map.getZoom() < 9) {
            $(".propSymbols").show();
            $(".hotspots").hide();
            $("#timeSliderWrapper").show();
            $("#birdLegend").show();
            $("#hotspotLegend").hide();
        };
        if (map.getZoom() >= 9) {
            $(".propSymbols").hide();
            $(".hotspots").show();
            $("#timeSliderWrapper").hide();
            $("#birdLegend").hide();
            $("#hotspotLegend").show();
        }
    });

    // Listener for the zoom to full button
    $('#zoomFullButton').click(function () {
        //        map.setView([41, -96], 5)
        map.flyTo([40, -97], defaultZoom, {
            duration: 0.6,
        })
    })
};

// Creates listeners to open/close the About Map overlay
function createAboutMapListeners() {
    $(document).ready(function () {
        $("#aboutMap, #aboutMapTop").click(function () {
            $("#aboutMapUnderlay, #aboutMapOverlay").show()
        });

        $("#aboutMapUnderlay, #aboutMapOverlayX").click(function () {
            $("#aboutMapUnderlay, #aboutMapOverlay").hide();
        });
    });

};

// Initialize all JavaScript #flowControl
main();


// END
