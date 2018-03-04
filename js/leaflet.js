// Initialize Leaflet map

var mymap = L.map('map', {
    minZoom: 4,
    maxZoom: 13
});


mymap.setView([41, -96], 5);

// Basemap
var Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Data Source: <a href="https://ebird.org/">eBird</a> |  Illustrations &copy; <a href="http://www.sibleyguides.com/">David Allen Sibley</a> | Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
}).addTo(mymap);

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

//function onEachFeature(feature, layer) {
//
//    //no property named popupContent; instead, create html string with all properties
//    var popupContent = "";
//    if (feature.properties) {
//
//        //        //loop to add feature property names and values to html string
//        //        for (var property in feature.properties) {
//        //            popupContent = feature.properties[property] + "</p>";
//        //            break
//        //        }
//        popupContent = "<div>" + feature.properties.NAME + "</div>"
//        layer.bindPopup(popupContent);
//    };
//};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue, attTotal) {

    //scale factor to adjust symbol size evenly




    var weightedValue = (attValue * 100) / (attTotal);
    var scaleFactor = 1.33;

    //radius calculated based on area
    //        var radius = Math.sqrt(area / Math.PI);


    var radius = weightedValue * scaleFactor


    return (attTotal == 1 || attTotal == 2) ? 1 : radius;
};


// Turns markers into the proportional symbols
function pointToLayer(feature, latlng, attributes, map, cities) {

    //    var East_southWest = L.latLng(38.429478, -78.870317);
    //    var East_northEast = L.latLng(38.435428, -78.856346);
    //    var East_bounds = L.latLngBounds(East_southWest, East_northEast);
    //    map.fitBounds(East_bounds);

    // JAN = 1, FEB = 2 etcetera
    monthSelection = 1

    var attribute = attributes[monthSelection - 1];

    var classNameString = "propSymbols " + attributes[12][0]

    //    var attribute = monthIndex[monthTracker];
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


    //Step 5: For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);
    var attTotal = Number(feature.properties[attributes[12][0]]);


    //Step 6: Give each feature's circle marker a radius based on its attribute value
    geojsonMarkerOptions.radius = calcPropRadius(attValue, attTotal);

    //create circle markers
    var layer = L.circleMarker(latlng, geojsonMarkerOptions);


    //build popup content string
    var currentCity = feature.properties.NAME
    var popupContent = "<div class='currentCity'>" + currentCity + "</div><div class='explorePopupButton' onclick='exploreCityRelay(" + '"' + currentCity + '"' + ")'>Explore</div><input type='button' value='Click Me' class='testButton'>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent);


    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
}



function createPropSymbols(data, map, attributes, cities) {


    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng, map, cities) {
            return pointToLayer(feature, latlng, attributes, map, cities);
        }
    }).addTo(map);
};

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

            console.log(props[month]);
            console.log(month);

            //    var attTotal = Number(feature.properties[attributes[12][0]]);

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[month], props[currentTotal]);
            layer.setRadius(radius);


            //            //add city to popup content string
            //            var popupContent = "<p><b>City:</b> " + props.City + "</p>";
            //
            //            //add formatted attribute to panel content string
            //            var year = attribute.split("_")[1];
            //            popupContent += "<p><b>Population in " + year + ":</b> " + props[attribute] + " million</p>";
            //
            //            //replace the layer popup
            //            layer.bindPopup(popupContent, {
            //                offset: new L.Point(0, -radius)
            //            });
        };
    });

};

function createSequenceControls(map, attributes) {
    $('#timeSliderWrapper').append('<button class="" id="play">PLAY</button>');

    $('#timeSliderWrapper').append('<button class="skip" id="reverse"><</button>');

    //create range input element
    $('#timeSliderWrapper').append('<div id="range-slider-wrapper"><input id="range-slider" type="range"></div>');

    // range slider buttons
    $('#timeSliderWrapper').append('<button class="skip" id="forward">></button>');

    // Month indicator
    $('#timeSliderWrapper').append('<div class="" id="monthIndicator">OCT</div>');

    //set slider attributes
    $('#range-slider').attr({
        max: 11,
        min: 0,
        value: 0,
        step: 1
    });



    $('#play').click(function () {
        var playSpeed = 360

        // Update slider
        $('#range-slider').val(0);

        // Update symbol sizes
        updatePropSymbols(map, attributes[0]);

        // Update month indicator
        $('#monthIndicator').html("<span>" + attributes[0].substr(7) + "</span>");
        var i2 = 0
        for (var i = 0; i < 11; i++) {
            setTimeout(function () {
                i2++

                // Update slider
                $('#range-slider').val(i2);


                // Update symbol sizes
                updatePropSymbols(map, attributes[i2]);


                // Update month indicator
                $('#monthIndicator').html("<span>" + attributes[i2].substr(7) + "</span>");



            }, (i + 1) * playSpeed);
        };
        setTimeout(function () {
            $('#range-slider').val(0);
            updatePropSymbols(map, attributes[0]);
            $('#monthIndicator').html("<span>" + attributes[0].substr(7) + "</span>");
        }, playSpeed * 12)
    });


    //Step 5: click listener for buttons
    $('.skip').click(function () {
        //get the old index value
        var index = $('#range-slider').val();

        //Step 6: increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward') {
            index++;
            //Step 7: if past the last attribute, wrap around to first attribute
            index = index > 11 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse') {
            index--;
            //Step 7: if past the first attribute, wrap around to last attribute
            index = index < 0 ? 11 : index;
        };

        // Update slider
        $('#range-slider').val(index);

        // Update symbol sizes
        updatePropSymbols(map, attributes[index]);

        // Update month indicator
        $('#monthIndicator').html("<span>" + attributes[index].substr(7) + "</span>");
    });

    //Step 5: input listener for slider
    $('#range-slider').on('input', function () {
        //Step 6: get the new index value
        var index = $(this).val();

        // Update symbol sizes
        updatePropSymbols(map, attributes[index]);

        // Update month indicator
        $('#monthIndicator').html("<span>" + attributes[index].substr(7) + "</span>");
    });
};

var exploreCityTracker = null;

function exploreCityRelay(cityName) {
    exploreCityTracker = cityName
};

function createExploreCityControls(map, cities) {
    //    map.fitBounds(cities[16][1])

    $("html").click(function () {
        if (exploreCityTracker != null) {
            var city;
            for (var i = 0, len = cities.length; i < len; i++) {
                if (cities[i][0] === exploreCityTracker) {
                    city = cities[i];
                    break;
                }
            };
            map.fitBounds(city[1])

        };
        exploreCityTracker = null
    });

}
//        fillColor: "#0570b0",
//        color: "#0570b0",
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

    console.log(attributes_customOrder);
    return attributes_customOrder;
};


function getCityZoomLevels(map, data) {

    cities = [];

    for (i in data.features) {

        var cityName = data.features[i].properties.NAME;
        var cityX = data.features[i].geometry.coordinates[0];
        var cityY = data.features[i].geometry.coordinates[1];

        var southWest = L.latLng(cityY - 0.2, cityX - 0.2);
        var northEast = L.latLng(cityY + 0.2, cityX + 0.2);
        var bounds = L.latLngBounds(southWest, northEast);

        cities.push([cityName, bounds]);

        //        cities.push({
        //            key: cityName,
        //            value: bounds
        //        });
    };

    return cities
};

function handleLayerZoomDisplay(data, map) {


    map.on('zoomend', function () {
        points = map.layer;
        if (map.getZoom() < 6) {
            $(".propSymbols").show()
        }
        if (map.getZoom() >= 6) {
            $(".propSymbols").hide()
        }
    })
};

//function to retrieve the data and place it on the map
function getData(map) {
    //load the data
    $.ajax("geojson/Timeseries_JT4.geojson", {
        dataType: "json",
        success: function (response) {


            //create a Leaflet GeoJSON layer and add it to the map
            //            L.geoJson(response, {
            //                onEachFeature: onEachFeature
            //            }).addTo(mymap);


            //REFERENCE CIRCLES

            //            var circleExtentMarkerOptions = {
            //                radius: 40,
            //                color: "rgb(180,180,180)",
            //                weight: 1,
            //                opacity: 1,
            //                fillOpacity: 0
            //            };
            //            L.geoJson(response, {
            //                pointToLayer: function (feature, latlng) {
            //                    var circleExtentMarkers = L.circleMarker(latlng, circleExtentMarkerOptions);
            //                    //build popup content string
            //                    var popupContent = "<div>City: " + feature.properties.NAME + "</div>";
            //
            //                    //bind the popup to the circle marker
            //                    circleExtentMarkers.bindPopup(popupContent);
            //                    return circleExtentMarkers
            //                }
            //            }).addTo(mymap); 

            var juncoAttributes = processData(response, "JNC");
            var tanagerAttributes = processData(response, "TAN");
            var cities = getCityZoomLevels(mymap, response);
            glbl_cities = cities
            createPropSymbols(response, mymap, juncoAttributes, cities);
            createPropSymbols(response, mymap, tanagerAttributes, cities);
            createSequenceControls(mymap, juncoAttributes);
            createExploreCityControls(mymap, cities);
            handleLayerZoomDisplay(response, mymap);


        }
    });
};

getData();







//d
