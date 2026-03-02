import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

let registered = false;

const ensureChartRegistration = () => {
  if (registered) {
    return;
  }

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    Filler,
  );

  ChartJS.defaults.font.family = "'Inter', ui-sans-serif, system-ui";
  ChartJS.defaults.color = '#475569';
  ChartJS.defaults.plugins.legend.labels = {
    usePointStyle: true,
    boxWidth: 8,
    boxHeight: 8,
    padding: 12,
  };

  registered = true;
};

export { ensureChartRegistration };
