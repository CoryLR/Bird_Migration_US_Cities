// Initialize Leaflet map
var mymap = L.map('map').setView([41, -95], 5);

// Basemap
var Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Data Source: <a href="https://ebird.org/">eBird</a> |  Illustrations &copy; <a href="http://www.sibleyguides.com/">David Allen Sibley</a> | Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
}).addTo(mymap);

function onEachFeature(feature, layer) {
    //no property named popupContent; instead, create html string with all properties
    var popupContent = "";
    if (feature.properties) {

        //        //loop to add feature property names and values to html string
        //        for (var property in feature.properties) {
        //            popupContent = feature.properties[property] + "</p>";
        //            break
        //        }
        popupContent = "<div>" + feature.properties.NAME + "</div>"
        layer.bindPopup(popupContent);
    };
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly

    var scaleFactor = 1.33;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    //        var radius = Math.sqrt(area / Math.PI);


    var radius = area

    return radius;
};


// Turns markers into the proportional symbols
function pointToLayer(feature, latlng, attributes) {

    // JAN = 1, FEB = 2 etcetera
    monthSelection = 1

    var attribute = attributes[monthSelection - 1];

    //    var monthTracker = 10;
    //    var monthIndex = {
    //        1: "PCT_01_JAN",
    //        2: "PCT_02_FEB",
    //        3: "PCT_03_MAR",
    //        4: "PCT_04_APR",
    //        5: "PCT_05_MAY",
    //        6: "PCT_06_JUN",
    //        7: "PCT_07_JUL",
    //        8: "PCT_08_AUG",
    //        9: "PCT_09_SEP",
    //        10: "PCT_10_OCT",
    //        11: "PCT_11_NOV",
    //        12: "PCT_12_DEC"
    //    };    //
    //    function iterateMonthTracker() {
    //        if (monthTracker > 11) {
    //            monthTracker = 1
    //        } else {
    //            monthTracker++
    //        }
    //    };

    //    var attribute = monthIndex[monthTracker];
    //create marker options
    var geojsonMarkerOptions = {
        radius: 0,
        fillColor: "darkgray",
        color: "#000",
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.2
    };


    //Step 5: For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Step 6: Give each feature's circle marker a radius based on its attribute value
    geojsonMarkerOptions.radius = calcPropRadius(attValue);

    //create circle markers
    var layer = L.circleMarker(latlng, geojsonMarkerOptions);

    //build popup content string
    var popupContent = "<div>City: " + feature.properties.NAME + "</div>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent);

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
}



function createPropSymbols(data, map, attributes) {


    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

function updatePropSymbols(map, attribute) {
    map.eachLayer(function (layer) {
        //        if (true) {

        if (layer.feature && layer.feature.properties[attribute]) {
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
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
    $('#timeSliderWrapper').append('<div class="" id="monthIndicator">JAN</div>');

    //set slider attributes
    $('#range-slider').attr({
        max: 11,
        min: 0,
        value: 0,
        step: 1
    });



    $('#play').click(function () {
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
                console.log("tick");

                // Update slider
                $('#range-slider').val(i2);


                // Update symbol sizes
                updatePropSymbols(map, attributes[i2]);


                // Update month indicator
                $('#monthIndicator').html("<span>" + attributes[i2].substr(7) + "</span>");



            }, (i + 1) * 500);
        }
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
        console.log("range-slider");

        // Update symbol sizes
        updatePropSymbols(map, attributes[index]);

        // Update month indicator
        $('#monthIndicator').html("<span>" + attributes[index].substr(7) + "</span>");
    });
};

function processData(data) {
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties) {
        //only take attributes with population values
        if (attribute.indexOf("PCT") > -1) {
            attributes.push(attribute);
        };
    };


    return attributes;
};
//function to retrieve the data and place it on the map
function getData(map) {
    //load the data
    $.ajax("geojson/JuncoTimeseries_no0.geojson", {
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


            var attributes = processData(response);
            createPropSymbols(response, mymap, attributes);
            createSequenceControls(mymap, attributes);
        }
    });
};

getData();









//d
