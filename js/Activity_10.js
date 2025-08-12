//Alex Krebs
//Geog 575 Activity 10 Choropleth Map and Coordinated Visualization
//Code creates a map and bar graph depicting percent households with a cell phone in each Wisconsin County
//Will need to find a layer to add Canadian Provinces
//Will need to adjust bar graph and map position to add explanatory text
//Need to make minor color changes for graph labels


//self executing anonymous function to local scope
(function(){
var attrArray = ["disaster_dec" ,"totpop","area_sq_miles", "pop_density", "at_risk_ben_z-score", "percent_at_risk_ben", "percent_households_with_cell_phone", "percent_over_65_living_alone", "percent_speak_english_less_than_well"];
var expressed = "percent_households_with_cell_phone";
// Execute script when window is loaded
window.onload = setMap;

// Set up choropleth map
function setMap() {
     //map frame dimensions
    var width = 700,
        height = 500;
    //container for map
     var map = d3.select("#container")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
    //d3 projection with projection parameters  
    var projection = d3.geoAlbers()
    .center([0, 44.83])         
    .rotate([90, 0])           
    .parallels([42.5, 46.5])   
    .scale(6000)              
    .translate([width / 2, height / 2]);  // Center map in SVG

var path = d3.geoPath().projection(projection);

    //apply projection to spatial data
    var path = d3.geoPath()
        .projection(projection);

    // Use Promise.all to parallelize asynchronous data loading
    var promises = [];
        promises.push(d3.csv("data/Data/Lab_2_Dataset.csv"));
        promises.push(d3.json("data/Data/WI_County_Boundaries.topojson"));
        promises.push(d3.json("data/Data/US_States.topojson"));

        Promise.all(promises).then(callback);

    

        function callback(data) {
            var csvData = data[0], wiCounty = data[1], us_States = data[2];      

            //create graticule generator for background   
            var graticule = d3.geoGraticule();

            map.append("path")
                .datum(graticule.outline())
                .attr("class", "gratBackground")
                .attr("d", path);


            // translate data TopoJSONs
            var wiCounties = topojson.feature(wiCounty, wiCounty.objects.WI_Counties).features,
                usStates = topojson.feature(us_States, us_States.objects.cb_2018_us_state_5m).features;

            wiCounties = joinData(wiCounties, csvData);

            var colorScale = makeColorScale(wiCounties); // Use GeoJSON for consistent properties
            setEnumerationUnits(wiCounties, usStates, map, path, colorScale);
            setChart(csvData, colorScale);
        };
    };
//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = 700,
        chartHeight = 500,
        leftPadding = 25,
        rightPadding = 10,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("#container")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([chartInnerHeight, 0])
        .domain([0, 100]);

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.adm1_code;
        })
        .attr("width", chartInnerWidth / csvData.length - 4)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return chartInnerHeight - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return colorScale(d[expressed]);
        });

    //create a text element for the chart title
    var titleX = 40; // horizontal position, adjust as needed
    var titleY = topBottomPadding; // top padding of the chart area
    var titleYOffset = 15; // pixels above the top padding

    var chartTitle = chart.append("text")
        .attr("x", chartWidth / 2) // center horizontally
        .attr("y", 20) // a safe, visible y-position
        .attr("text-anchor", "middle") // center-align the text
        .attr("class", "chartTitle")
        .text("Percent of Households With a Cell Phone in Each Wisconsin County");
    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
};

function makeColorScale(data){
    var colorClasses = [
        "#deebf7", 
        "#9ecae1", 
        "#6baed6", 
        "#2171b5", 
        "#08306b" 
];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

     var domainArray = data.map(function(d){
        return parseFloat(d.properties[expressed]);
    });

    colorScale.domain(domainArray);

    return colorScale;
}
function joinData(wiCounties, csvData){
    //loop through csv to assign each set of csv attribute values to geojson county
    for (var i=0; i<csvData.length; i++){
        var csvCounty = csvData[i]; //the current county
        var csvKey = csvCounty.County; //the CSV primary key

        //loop through geojson counties to find correct county
        for (var a=0; a<wiCounties.length; a++){

            var geojsonProps = wiCounties[a].properties; //the current county geojson properties
            var geojsonKey = geojsonProps.NAME; //the geojson primary key

            csvKey = csvCounty.County.trim().toLowerCase();
            geojsonKey = geojsonProps.NAME.trim().toLowerCase();

            if (geojsonKey === csvKey) {
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvCounty[attr]);
                    geojsonProps[attr] = val;
                    });
                };
            };
        };

    return wiCounties;
};

function setEnumerationUnits(wiCounties, usStates, map, path){
        var colorScale = makeColorScale(wiCounties);
     // add states to the map
        var states = map.selectAll(".states")
            .data(usStates)
            .enter()
            .append("path")
            .attr("class", "states")
            .attr("d", path);
            //add WI counties to the map
        var counties = map.selectAll(".counties")
            .data(wiCounties)
            .enter()
            .append("path")
            .attr("class", function(d){
                    return "counties " + d.properties.NAME;
            })        
            .attr("d", path)        
                .style("fill", function(d){            
                    var value = d.properties[expressed];            
                    if(value) {                
                        return colorScale(d.properties[expressed]);            
                } else {                
                    return "#ccc";            
                }    
        });
    }
})();