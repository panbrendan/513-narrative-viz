import { params } from '../main.js';

export function renderScene5() {
  const { data, buzzAnnotations } = params;
  const companiesAll = ['AAPL', 'AMZN', 'GOOGL', 'MSFT', 'NVDA'];
  const colors = d3.schemeCategory10;
  const fmtDate = d3.timeFormat('%Y-%m-%d');
  const parseDate = d3.timeParse('%Y-%m-%d');

  const container = d3.select('#viz');
  container.selectAll('*').remove();
  container.append('h2')
    .attr('class', 'scene-title')
    .text('Overview: All Buzzword Mentions');
  container.append('p')
    .attr('class', 'scene-desc')
    .text('Select a date range and company to zoom in');

  const controls = container.append('div').attr('class', 'controls');
  controls.append('label').text('From: ');
  controls.append('input')
    .attr('type', 'date')
    .attr('id', 'date-start')
    .attr('value', fmtDate(d3.min(data, d => d.date)));
  controls.append('label').text(' To: ');
  controls.append('input')
    .attr('type', 'date')
    .attr('id', 'date-end')
    .attr('value', fmtDate(d3.max(data, d => d.date)));
  controls.append('label').text(' Company: ');
  const select = controls.append('select').attr('id', 'company-select');
  select.selectAll('option')
    .data(['All', ...companiesAll])
    .join('option')
    .attr('value', d => d)
    .text(d => d);

  function draw() {
    const start = parseDate(d3.select('#date-start').property('value'));
    const end = parseDate(d3.select('#date-end').property('value'));
    const sel = d3.select('#company-select').property('value');

    container.selectAll('svg.chart-svg').remove();
    container.selectAll('.nav-buttons').remove();
    d3.select('body').selectAll('.tooltip').remove();

    const slice = data.filter(d => d.date >= start && d.date <= end);

    const drawCompanies = sel === 'All'
      ? companiesAll
      : [sel];

    let allAnnots = [];
    Object.values(buzzAnnotations).forEach(list => allAnnots.push(...list));
    const annots = sel === 'All'
      ? allAnnots
      : allAnnots.filter(a => a.company === sel);

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
        d3.min(slice, d => d3.min(drawCompanies, c => d[c])) * 0.95,
        d3.max(slice, d => d3.max(drawCompanies, c => d[c])) * 1.05
      ])
      .range([height, 0]);

    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('display', 'none');

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
          const j = bis(slice, x0);
          const d0 = slice[j - 1] || slice[0], d1 = slice[j] || d0;
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
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%m/%d/%Y')).ticks(6))
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

    const placed = [];
    annots.forEach(evt => {
      if (!drawCompanies.includes(evt.company)) return;
      const pt = slice.reduce((p, c) =>
        Math.abs(c.date - evt.date) < Math.abs(p.date - evt.date) ? c : p,
        slice[0]
      );
      const x0 = x(pt.date), y0 = y(pt[evt.company]);
      const color = colors[companiesAll.indexOf(evt.company)];

      const temp = svg.append('text')
        .attr('visibility', 'hidden')
        .style('font-size', '0.75rem')
        .text(evt.label);
      const bbox = temp.node().getBBox();
      temp.remove();
      const padX = 8, padY = 6;
      const boxW = bbox.width + padX * 2, boxH = bbox.height + padY * 2;

      let off = 30;
      for (let k = 0; k < 5; k++) {
        const yBox = y0 - boxH - off;
        const clash = placed.some(b =>
          Math.abs(b.x0 - x0) < (b.boxW + boxW) / 2 &&
          Math.abs(b.yBox - yBox) < (b.boxH + boxH) / 2
        );
        if (!clash) { placed.push({ x0, yBox, boxW, boxH }); break; }
        off += boxH + 10;
      }
      const yBox = y0 - boxH - off;

      svg.append('circle')
        .attr('cx', x0).attr('cy', y0)
        .attr('r', 4).attr('fill', color)
        .attr('stroke', '#fff').attr('stroke-width', 1.5);

      svg.append('line')
        .attr('x1', x0).attr('y1', yBox + boxH)
        .attr('x2', x0).attr('y2', y0)
        .attr('stroke', color)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2');

      svg.append('rect')
        .attr('x', x0 - boxW / 2).attr('y', yBox)
        .attr('width', boxW).attr('height', boxH)
        .attr('fill', 'white').attr('stroke', color)
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
      .text('← Back')
      .on('click', () => window.prevScene());
  }

  d3.selectAll('#date-start,#date-end,#company-select').on('change', draw);

  draw();
}
