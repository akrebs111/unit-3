//Alex Krebs
//Geog575 Activity 9
//Lab 2 basemap
//Will find a new shapefile with Canada borders for the Lab 2 final turn in.

// Execute script when window is loaded
window.onload = setMap;

// Set up choropleth map
function setMap() {
     //map frame dimensions
    var width = 960,
        height = 460;
    //container for map
     var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
    //d3 projection with projection parameters  
    var projection = d3.geoAlbers()
    .center([0, 45.5])               
    .rotate([90, 0])                
    .parallels([42.5, 46.5])         
    .scale(4000)                     
    .translate([width / 2, height / 2]);

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
    var csvData = data[0],
        wiCounty = data[1],
        us_States = data[2];

    //create graticule generator for background   
    var graticule = d3.geoGraticule();

    map.append("path")
        .datum(graticule.outline())
        .attr("class", "gratBackground")
        .attr("d", path);


    // translate data TopoJSONs
    var wiCounties = topojson.feature(wiCounty, wiCounty.objects.WI_Counties),
        usStates = topojson.feature(us_States, us_States.objects.cb_2018_us_state_5m).features;

    // add states to the map
    var states = map.selectAll(".states")
        .data(usStates)
        .enter()
        .append("path")
        .attr("class", "states")
        .attr("d", path);
    //add WI counties to the map
    var counties = map.selectAll(".counties")
        .data(wiCounties.features)
        .enter()
        .append("path")
        .attr("class", function(d){
                return "counties " + d.properties.name;
            })
            .attr("d", path);
    }
    
};