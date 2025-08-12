//Alex Krebs
//Geog 575 Lab 2
//Create Choropelth map with bar chart.
//Hover over counties to see popup information about households with cellphones and have responsive interaction with the chart
//sources inclue D3, TopoJSON, 2023 ACS (US Census Bureau), Natural Earth and WI DNR

//self executing anonymous function to local scope
(function(){
var attrArray = ["disaster_dec" ,"totpop","area_sq_miles", "pop_density", "at_risk_ben_z-score", "percent_at_risk_ben", "percent_households_with_cell_phone", "percent_over_65_living_alone", "percent_speak_english_less_than_well"];
var expressed = "percent_households_with_cell_phone";

//function to remove "_" from attribute names
function formatClassName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, "_");
}

//function to add mouseover effect
function mouseOver(d, isBar = true) {
    const className = formatClassName(isBar ? d.County : d.properties.NAME);

    d3.selectAll(`.bar.${className}`)
        .style("stroke", "#000")
        .style("stroke-width", 2)
        .style("opacity", 1);

    d3.selectAll(`.counties.${className}`)
        .style("stroke", "#fff") 
        .style("stroke-width", 2)
        .style("opacity", 1);

    const dataProps = isBar ? d : d.properties;
    popUP.style("visibility", "visible")
        .html(createPopupContent(dataProps, expressed));
}
//function to reset mouseover effect
function mouseOut(d, isBar = true) {
    const className = formatClassName(isBar ? d.County : d.properties.NAME);

    d3.selectAll(`.bar.${className}`)
        .style("stroke", null)
        .style("stroke-width", null)
        .style("opacity", 0.9);

    d3.selectAll(`.counties.${className}`)
        .style("stroke", null)
        .style("stroke-width", null)
        .style("opacity", 0.9);

    popUP.style("visibility", "hidden");
}
//function to clean up field name for popup
function formatAttributeName(attr) {
    return attr
        .replace(/_/g, " ")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
//function to create popups 
function createPopupContent(properties, attribute) {
    var value = properties[attribute];
    var countyValue = parseFloat(value);
    var countyName = (properties.NAME || properties.County || "Unknown")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    var allValues = d3.selectAll(".counties").data().map(d => d.properties[attribute]);
    var meanValue = d3.mean(allValues);

    var diff = countyValue - meanValue;

    var comparisonText;
    if (diff > 0) {
        comparisonText = diff.toFixed(1) + "% above average";
    } else if (diff < 0) {
        comparisonText = Math.abs(diff).toFixed(1) + "% below average";
    } else {
        comparisonText = "equal to the average";
    }

    return `
        <p><strong>${countyName} County</strong></p>
        <p><b>${formatAttributeName(attribute)}:</b> ${countyValue.toFixed(1)}%</p>
        <p><b>Compared to WI average:</b> ${comparisonText}</p> 
    `;
}
//popup variable
var popUP = d3.select("body").append("div")
    .attr("class", "popUP");

// Execute script when window is loaded
window.onload = setMap;

// Set up choropleth map
function setMap() {
     //map frame dimensions
    var width = 700,
        height = 500;

    var map = d3.select("#container")
        .append("svg")
        .attr("class", "map")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("width", "100%")
        .style("height", "auto");
    //d3 projection with projection parameters  
    var projection = d3.geoAlbers()
    .center([0, 44.83])         
    .rotate([90, 0])           
    .parallels([42.5, 46.5])   
    .scale(6000)              
    .translate([width / 2, height / 2]);  // Center map in SVG

var path = d3.geoPath().projection(projection);


    // Use Promise.all to parallelize asynchronous data loading
    var promises = [];
        promises.push(d3.csv("data/Data/Lab_2_Dataset.csv"));
        promises.push(d3.json("data/Data/WI_County_Boundaries.topojson"));
        promises.push(d3.json("data/Data/US_States.topojson"));

        Promise.all(promises).then(callback);

    

        function callback(data) {
            var csvData = data[0], wiData = data[1], us_States = data[2];      

            //create graticule generator for background   
            var graticule = d3.geoGraticule();

            map.append("path")
                .datum(graticule.outline())
                .attr("class", "gratBackground")
                .attr("d", path);


            // translate data TopoJSONs
            var wiCounties = topojson.feature(wiData, wiData.objects.WI_Counties).features,
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
    var chartWidth = 500,
        chartHeight = 250,
        leftPadding = 40,
        rightPadding = 40,
        topBottomPadding = 10,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("#container")
        .append("svg")
        .attr("viewBox", `0 0 ${chartWidth} ${chartHeight}`)
        .style("width", "100%")
        .style("height", "auto")
        .attr("class", "chart")

    chart.append("text")
        .attr("class", "axis-title")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${leftPadding / 4}, ${chartInnerHeight / 2 + topBottomPadding}) rotate(-90)`)
        .style("font-size", "12px")
        .text("Percent (%)");

    // X-axis title (counties)
    chart.append("text")
        .attr("class", "axis-title")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${chartInnerWidth / 2 + leftPadding}, ${chartInnerHeight + topBottomPadding + 35})`)
        .style("font-size", "12px")
        .text("Wisconsin Counties");

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

    //create vertical axis generator (added)
    var yAxis = d3.axisLeft(yScale);

    //set bars for each county
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.County.trim().toLowerCase().replace(/\s+/g, "_");
        })
        .attr("width", chartInnerWidth / csvData.length - 4)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d){
            return chartInnerHeight - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return colorScale(d[expressed]);
        })
        .on("mouseover", function(event, d) {
            mouseOver(d, true);
        })
        .on("mouseout", function(event, d) {
            mouseOut(d, true);
        });

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
};
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
                return "counties " + d.properties.NAME.trim().toLowerCase().replace(/\s+/g, "_");
            })       
            .attr("d", path)        
            .style("fill", function(d){            
                var value = d.properties[expressed];            
                if(value) {                
                    return colorScale(value);            
                } else {                
                    return "#ccc";            
                } 
            })
            .on("mouseover", function(event, d) {
                mouseOver(d, false);
            })
            .on("mousemove", function(event) {
                popUP.style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function(event, d) {
                mouseOut(d, false);
});
        }

    
})();