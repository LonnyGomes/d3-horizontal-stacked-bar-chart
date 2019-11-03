import './main.css';
import jsonData from './data.json';
import * as d3 from 'd3';

const keys = ['val1', 'val2', 'val3'];

const year = [...new Set(jsonData.map(d => d.year))];
const states = [...new Set(jsonData.map(d => d.state))];

const margin = { top: 35, left: 35, bottom: 0, right: 0 };
const svgWidth = 650;
const svgHeight = 400;
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const options = d3
    .select('#year')
    .selectAll('option')
    .data(year)
    .enter()
    .append('option')
    .text(d => d);

const svg = d3
    .select('#chart')
    .append('svg')
    .attr('width', svgWidth)
    .attr('height', svgHeight);

const x = d3
    .scaleBand()
    .range([margin.left, width - margin.right])
    .padding(0.1);

const y = d3.scaleLinear().rangeRound([height - margin.bottom, margin.top]);

const xAxis = svg
    .append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .attr('class', 'x-axis');

const yAxis = svg
    .append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .attr('class', 'y-axis');

const z = d3
    .scaleOrdinal()
    .range(['steelblue', 'darkorange', 'lightblue'])
    .domain(keys);

const update = (inputVal, speed) => {
    const input = +inputVal;
    const sumKeys = d => d3.sum(keys, curKey => +d[curKey]);
    const data = jsonData
        .filter(f => f.year === input)
        .map(d => {
            d.total = sumKeys(d);
            return d;
        });

    y.domain([0, d3.max(data, d => sumKeys(d))]).nice();

    svg.selectAll('.y-axis')
        .transition()
        .duration(speed)
        .call(d3.axisLeft(y).ticks(null, 's'));

    data.sort(
        d3.select('#sort').property('checked')
            ? (a, b) => b.total - a.total
            : (a, b) => states.indexOf(a.state) - states.indexOf(b.state)
    );

    x.domain(data.map(d => d.state));

    svg.selectAll('.x-axis')
        .transition()
        .duration(speed)
        .call(d3.axisBottom(x).tickSizeOuter(0));

    const group = svg
        .selectAll('g.layer')
        .data(d3.stack().keys(keys)(data), d => {
            return d.key;
        });

    group.exit().remove();

    group
        .enter()
        .append('g')
        .classed('layer', true)
        .attr('fill', d => {
            return z(d.key);
        });

    const bars = svg
        .selectAll('g.layer')
        .selectAll('rect')
        .data(
            d => d,
            e => {
                return e.data.state;
            }
        );

    bars.exit().remove();

    bars.enter()
        .append('rect')
        .attr('width', x.bandwidth())
        .merge(bars)
        .transition()
        .duration(speed)
        .attr('x', d => x(d.data.state))
        .attr('y', d => y(d[1]))
        // TODO:review this
        .attr('height', d => y(d[0]) - y(d[1]));

    const text = svg.selectAll('.text').data(data, d => d.state);

    text.exit().remove();

    text.enter()
        .append('text')
        .attr('class', 'text')
        .attr('text-anchor', 'middle')
        .merge(text)
        .transition()
        .duration(speed)
        .attr('x', d => x(d.state) + x.bandwidth() / 2)
        .attr('y', d => y(d.total) - 5)
        .text(d => d.total);
};

update(d3.select('#year').property('value'), 0);

const select = d3.select('#year').on('change', function() {
    update(this.value, 750);
});

d3.select('#sort').on('click', () => {
    update(select.property('value'), 750);
});
