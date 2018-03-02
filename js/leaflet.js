// Initialize Leaflet map
var mymap = L.map('map').setView([40, -97], 5);

// Basemap
var Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
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

// Turns markers into the proportional symbols
function pointToLayer(feature, latlng) {

    var monthTracker = 10;
    var monthIndex = {
        1: "PCT_01_JAN",
        2: "PCT_02_FEB",
        3: "PCT_03_MAR",
        4: "PCT_04_APR",
        5: "PCT_05_MAY",
        6: "PCT_06_JUN",
        7: "PCT_07_JUL",
        8: "PCT_08_AUG",
        9: "PCT_09_SEP",
        10: "PCT_10_OCT",
        11: "PCT_11_NOV",
        12: "PCT_12_DEC"
    };
    //
    //    function iterateMonthTracker() {
    //        if (monthTracker > 11) {
    //            monthTracker = 1
    //        } else {
    //            monthTracker++
    //        }
    //    };

    var attribute = monthIndex[monthTracker];

    //create marker options
    var geojsonMarkerOptions = {
        radius: 0,
        fillColor: "darkgray",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //calculate the radius of each proportional symbol
    function calcPropRadius(attValue) {
        //scale factor to adjust symbol size evenly
        var scaleFactor = 50;
        //area based on attribute value and scale factor
        var area = attValue * scaleFactor;
        //radius calculated based on area
        //        var radius = Math.sqrt(area / Math.PI);
        var radius = attValue

        return radius;
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


function createPropSymbols(data, map) {


    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: pointToLayer
    }).addTo(map);
};

//function to retrieve the data and place it on the map
function getData(map) {
    //load the data
    $.ajax("geojson/JuncoTimeseries.geojson", {
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
            createPropSymbols(response, mymap);
        }
    });
};

getData();









//d
