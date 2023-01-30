// ==============================|| DASHBOARD - MARKET SHARE AREA CHART ||============================== //
import { Props } from 'react-apexcharts';

const chartData: Props = {
    height: '100%',
    type: 'area',
    options: {
        chart: {
            id: 'token-info-chart',
            toolbar: {
                show: false
            },
            zoom: {
                enabled: false
            }
        },
        grid: {
            show: false
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            curve: 'smooth',
            lineCap: 'butt',
            width: 2
        },
        xaxis: {
            type: 'datetime',
            tickPlacement: 'on',
            tooltip: {
                enabled: true
            }
        }
    }
};

export default chartData;
