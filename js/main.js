// js/main.js
import { renderScene0 } from './scenes/scene0_intro.js';
import { renderScene1 } from './scenes/scene1_iot.js';
import { renderScene2 } from './scenes/scene2_cloud.js';
import { renderScene3 } from './scenes/scene3_ml.js';
import { renderScene4 } from './scenes/scene4_genai.js';
import { renderScene5 } from './scenes/scene5_overview.js';

const scenes = [
  renderScene0,
  renderScene1,
  renderScene2,
  renderScene3,
  renderScene4,
  renderScene5
];

let current = 0;

export let params = {
  data: null,

  buzzAnnotations: {
    IoT: [
      { company: 'AAPL', date: new Date('2014-06-02'), label: 'HomeKit unveiled' },
      { company: 'AMZN', date: new Date('2014-11-06'), label: 'Amazon Echo launched' },
      { company: 'GOOGL', date: new Date('2014-01-13'), label: 'Nest Labs acquisition' },
      { company: 'MSFT', date: new Date('2014-05-07'), label: 'Azure IoT launched' },
    ],
    Cloud: [
      { company: 'AAPL', date: new Date('2011-06-06'), label: 'iCloud launch' },
      { company: 'AMZN', date: new Date('2015-04-23'), label: 'AWS profitability public' },
      { company: 'GOOGL', date: new Date('2019-07-25'), label: 'Google Cloud profitability' },
      { company: 'MSFT', date: new Date('2010-03-04'), label: 'Ballmer: All-in on Cloud' },
      { company: 'NVDA', date: new Date('2016-11-10'), label: 'Data-center (AI) earnings' }
    ],
    ML: [
      { company: 'AAPL', date: new Date('2016-07-26'), label: 'AI/ML public strategy' },
      { company: 'GOOGL', date: new Date('2016-03-15'), label: 'AlphaGO AI beats GO champion' },
      { company: 'MSFT', date: new Date('2016-09-26'), label: 'AI & Research Division formed' },
      { company: 'NVDA', date: new Date('2017-05-10'), label: 'Volta V100 GPU unveiled' }
    ],
    GenAI: [
      { company: 'AAPL', date: new Date('2023-05-04'), label: 'GenAI plans confirmed' },
      { company: 'AMZN', date: new Date('2023-08-03'), label: 'AWS GenAI deals' },
      { company: 'GOOGL', date: new Date('2023-02-07'), label: 'Bard demo fails' },
      { company: 'MSFT', date: new Date('2023-02-08'), label: 'Bing + OpenAI integration' },
      { company: 'NVDA', date: new Date('2023-05-24'), label: 'Demand for Gen AI earnings' }
    ]
  }
};

d3.csv('data/stock_data.csv', d => ({
  date: new Date(d.Date),
  AAPL: +d.Close_AAPL,
  AMZN: +d.Close_AMZN,
  GOOGL: +d.Close_GOOGL,
  MSFT: +d.Close_MSFT,
  NVDA: +d.Close_NVDA
})).then(rows => {
  params.data = rows;
  updateScene();
});

function updateScene() {
  d3.select('#viz').selectAll('*').remove();
  scenes[current]();
}

function nextScene() {
  if (current < scenes.length - 1) {
    current += 1;
    updateScene();
  }
}
function prevScene() {
  if (current > 0) {
    current -= 1;
    updateScene();
  }
}

window.nextScene = nextScene;
window.prevScene = prevScene;
