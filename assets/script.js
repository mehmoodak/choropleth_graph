var svg = null;

var svgData = {
  url_mapData:
    'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json',
  url_educationalData:
    'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json',
  mapData: null,
  educationalData: null,
  minPercentage: null,
  maxPercentage: null,
};

var svgAttributes = {
  width: 960,
  height: 550,
  margins: {
    top: 200,
    left: 50,
    right: 50,
    bottom: 50,
  },
  legendOptions: {
    width: 400,
    height: 30,
  },
};

var colorThreshold = d3
  .scaleThreshold()
  .domain([3, 12, 21, 30, 39, 48, 57, 66])
  .range([
    '#ffffff',
    '#e5f5e0',
    '#c7e9c0',
    '#a1d99b',
    '#74c476',
    '#41ab5d',
    '#238b45',
    '#006d2c',
    '#00441b',
  ]);

var path = d3.geoPath();

svg = d3
  .select('#graph')
  .append('svg')
  .attr('width', svgAttributes.width + svgAttributes.margins.left + svgAttributes.margins.right)
  .attr('height', svgAttributes.height + svgAttributes.margins.top + svgAttributes.margins.bottom);

try {
  fetch(svgData.url_mapData)
    .then(response => response.json())
    .then(function(mapData) {
      svgData.mapData = mapData;

      fetch(svgData.url_educationalData)
        .then(response => response.json())
        .then(function(educationalData) {
          svgData.educationalData = educationalData;
          svgData.minPercentage = d3.min(svgData.educationalData, d => d.bachelorsOrHigher);
          svgData.maxPercentage = d3.max(svgData.educationalData, d => d.bachelorsOrHigher);
        })
        .then(() => {
          drawGraph();
          log();
        })
        .catch(function(e) {
          alert('Error occured while drawing graph.');
          console.log(e);
        });
    })
    .catch(function(e) {
      alert('Error occured while drawing graph.');
      console.log(e);
    });
} catch (e) {
  console.log(e);
}

function log() {
  console.log('svg', svg);
  console.log('svgAttributes', svgAttributes);
  console.log('svgData', svgData);
}

function drawGraph() {
  // Show Texts
  svg
    .append('text')
    .text('United States Educational Attainment')
    .attr('id', 'title');

  svg
    .append('text')
    .text("Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)")
    .attr('id', 'description');

  // Show Counties
  svg
    .append('g')
    .attr('class', 'counties')
    .attr(
      'transform',
      'translate(' + svgAttributes.margins.left + ', ' + svgAttributes.margins.top + ')',
    )
    .selectAll('path')
    .data(topojson.feature(svgData.mapData, svgData.mapData.objects.counties).features)
    .enter()
    .append('path')
    .attr('class', 'county')
    .attr('d', path)
    .attr('data-fips', (d, i) => d.id)
    .attr(
      'data-education',
      (d, i) => svgData.educationalData.filter(obj => d.id === obj.fips)[0].bachelorsOrHigher,
    )
    .attr('fill', (d, i) =>
      colorThreshold(svgData.educationalData.filter(obj => d.id === obj.fips)[0].bachelorsOrHigher),
    );

  // Show States
  svg
    .append('path')
    .attr(
      'transform',
      'translate(' + svgAttributes.margins.left + ', ' + svgAttributes.margins.top + ')',
    )
    .datum(
      topojson.mesh(svgData.mapData, svgData.mapData.objects.states, function(a, b) {
        return a.id !== b.id;
      }),
    )
    .attr('class', 'states')
    .attr('d', path)
    .style('stroke', 'white')
    .style('stroke-linejoin', 'round')
    .style('stroke-width', '1.5px')
    .style('fill', 'none');

  // Show Legened
  showLegend();
  // Show Tooltip
  showTooltip();
}

function showTooltip() {
  d3.selectAll('.county')
    .on('mouseover', function(d, i) {
      var data = svgData.educationalData.filter(obj => d.id === obj.fips)[0];

      var html = '';
      html += 'County: ' + data.area_name;
      html += '</br>State: ' + data.state;
      html += '</br>Percentage: ' + data.bachelorsOrHigher + '%';

      d3.select('#tooltip')
        .attr('data-education', data.bachelorsOrHigher)
        .style('display', 'inline-block')
        .style('left', d3.event.pageX + 10 + 'px')
        .style('top', d3.event.pageY - 70 + 'px')
        .html(html);
    })
    .on('mouseout', function(d, i) {
      d3.select('#tooltip')
        .style('display', 'none')
        .html('');
    });
}

function showLegend() {
  var legend = svg
    .append('g')
    .attr('id', 'legend')
    .style('transform', 'translate(' + 390 + 'px,' + 140 + 'px)');

  var legendX = d3
    .scaleLinear()
    .domain([svgData.minPercentage, svgData.maxPercentage])
    .range([0, svgAttributes.legendOptions.width]);

  var legendXAxis = d3
    .axisBottom(legendX)
    .tickSize(10)
    .tickValues(colorThreshold.domain())
    .tickFormat(d => d + '%');

  legend
    .selectAll('rect')
    .data(
      colorThreshold.range().map(color => {
        range = colorThreshold.invertExtent(color);

        range[0] === undefined ? (range[0] = svgData.minPercentage) : range[0];
        range[1] === undefined ? (range[1] = svgData.maxPercentage) : range[1];

        return range;
      }),
    )
    .enter()
    .append('rect')
    .attr('x', d => legendX(d[0]))
    .attr('width', d => legendX(d[1]) - legendX(d[0]))
    .attr('height', svgAttributes.legendOptions.height)
    .style('fill', d => colorThreshold(d[0]))
    .style('stroke', 'white')
    .exit();

  legend
    .append('g')
    .call(legendXAxis)
    .style('transform', 'translateY(' + svgAttributes.legendOptions.height + 'px)')
    .style('color', 'transparent');
}
