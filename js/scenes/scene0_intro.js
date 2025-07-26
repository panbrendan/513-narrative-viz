export function renderScene0() {
  const viz = d3.select('#viz');
  viz.selectAll('*').remove();

  viz.append('h1')
    .attr('class', 'intro-title')
    .text('How have certain buzzwords affected the share price of top tech companies?');

  viz.append('button')
    .attr('class', 'start-button')
    .text('Start')
    .on('click', () => window.nextScene());
}
