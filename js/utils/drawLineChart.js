import { params } from '../main.js';

export function drawLineChart({ buzzKey = null }) {
  const { data, buzzAnnotations } = params;
  const companiesAll = ['AAPL', 'AMZN', 'GOOGL', 'MSFT', 'NVDA'];
  const colors = d3.schemeCategory10;
  const fmtDate = d3.timeFormat('%m/%d/%Y');

  const annots = buzzAnnotations[buzzKey] || [];

  let start, end;
  if (annots.length) {
    const dates = annots.map(a => a.date);
    start = d3.timeMonth.offset(d3.min(dates), -1);
    end = d3.timeMonth.offset(d3.max(dates), +1);
  } else {
    start = d3.min(data, d => d.date);
    end = d3.max(data, d => d.date);
  }

  const container = d3.select('#viz');
  container.selectAll('*').remove();

  if (buzzKey) {
    container.append('h2')
      .attr('class', 'scene-title')
      .text(`${buzzKey} Impact`);
  }

  const slice = data.filter(d => d.date >= start && d.date <= end);

  const margin = { top: 60, right: 120, bottom: 200, left: 80 };
  const width = window.innerWidth - margin.left - margin.right;
  const height = window.innerHeight - margin.top - margin.bottom;

  const svg = container.append('svg')
    .attr('class', 'chart-svg')
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime().domain([start, end]).range([0, width]);
  const y = d3.scaleLinear()
    .domain([
      d3.min(slice, d => d3.min(companiesAll, c => d[c])) * 0.95,
      d3.max(slice, d => d3.max(companiesAll, c => d[c])) * 1.05
    ])
    .range([height, 0]);

  const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('display', 'none');

  const drawCompanies = annots.length
    ? Array.from(new Set(annots.map(a => a.company)))
    : companiesAll;

  const lineGen = key => d3.line()
    .x(d => x(d.date))
    .y(d => y(d[key]));

  drawCompanies.forEach((c, i) => {
    const color = colors[companiesAll.indexOf(c)];

    svg.append('path')
      .datum(slice)
      .attr('d', lineGen(c))
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);

    svg.append('path')
      .datum(slice)
      .attr('d', lineGen(c))
      .attr('fill', 'none')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 30)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .style('pointer-events', 'stroke')
      .style('cursor', 'pointer')
      .on('mouseover', () => tooltip.style('display', 'block'))
      .on('mousemove', event => {
        const [mx] = d3.pointer(event, svg.node());
        const x0 = x.invert(mx);
        const bis = d3.bisector(d => d.date).left;
        const idx = bis(slice, x0);
        const d0 = slice[idx - 1] || slice[0];
        const d1 = slice[idx] || d0;
        const d = (x0 - d0.date > d1.date - x0) ? d1 : d0;
        tooltip.html(
          `Date: ${fmtDate(d.date)}<br>` +
          `<strong style="color:${color}">${c}</strong>: $${d[c].toFixed(2)}`
        )
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 25}px`);
      })
      .on('mouseout', () => tooltip.style('display', 'none'));
  });

  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(fmtDate).ticks(6))
    .append('text')
    .attr('class', 'axis-label')
    .attr('x', width / 2)
    .attr('y', margin.bottom - 20)
    .style('text-anchor', 'middle')
    .text('Date');

  svg.append('g')
    .call(d3.axisLeft(y))
    .append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -margin.left + 20)
    .style('text-anchor', 'middle')
    .text('Closing Price (USD)');

  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width + 20},0)`);

  drawCompanies.forEach((c, i) => {
    const color = colors[companiesAll.indexOf(c)];
    const row = legend.append('g')
      .attr('transform', `translate(0,${i * 20})`);
    row.append('rect')
      .attr('width', 12).attr('height', 12).attr('fill', color);
    row.append('text')
      .attr('x', 18).attr('y', 10)
      .text(c);
  });

  const placedBoxes = [];
  annots.forEach(evt => {
    const pt = slice.reduce((p, c) =>
      Math.abs(c.date - evt.date) < Math.abs(p.date - evt.date) ? c : p,
      slice[0]
    );
    const x0 = x(pt.date),
      y0 = y(pt[evt.company]);
    const color = colors[companiesAll.indexOf(evt.company)];

    const tempText = svg.append('text')
      .attr('class', 'annotation-temp')
      .style('font-size', '0.75rem')
      .text(evt.label)
      .attr('visibility', 'hidden');
    const bbox = tempText.node().getBBox();
    tempText.remove();
    const boxPaddingX = 8,
      boxPaddingY = 6;
    const boxW = bbox.width + boxPaddingX * 2,
      boxH = bbox.height + boxPaddingY * 2;

    let pad = 30;

    for (let i = 0; i < 5; i++) {
      const yBox = y0 - boxH - pad;
      const clash = placedBoxes.some(b =>
        Math.abs(b.x0 - x0) < (b.boxW + boxW) / 2 &&
        Math.abs(b.yBox - yBox) < (b.boxH + boxH) / 2
      );
      if (!clash) {
        placedBoxes.push({ x0, yBox, boxW, boxH });
        break;
      }
      pad += boxH + 10;
    }
    const yBox = y0 - boxH - pad;

    svg.append('circle')
      .attr('cx', x0)
      .attr('cy', y0)
      .attr('r', 4)
      .attr('fill', color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    svg.append('line')
      .attr('x1', x0)
      .attr('y1', yBox + boxH)
      .attr('x2', x0)
      .attr('y2', y0)
      .attr('stroke', color)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2');

    svg.append('rect')
      .attr('x', x0 - boxW / 2)
      .attr('y', yBox)
      .attr('width', boxW)
      .attr('height', boxH)
      .attr('fill', 'white')
      .attr('stroke', color)
      .attr('rx', 4).attr('ry', 4);

    svg.append('text')
      .attr('x', x0)
      .attr('y', yBox + boxH / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '0.75rem')
      .text(evt.label);
  });

  const nav = container.append('div').attr('class', 'nav-buttons');
  nav.append('button')
    .text('Back')
    .on('click', () => window.prevScene());
  nav.append('button')
    .text('Next')
    .on('click', () => window.nextScene());
}
