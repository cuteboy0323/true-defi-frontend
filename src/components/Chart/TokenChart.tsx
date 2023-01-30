import { useContext, useEffect, useMemo, useState } from 'react';

import axios from 'utils/axios';

import ApexCharts from 'apexcharts';
import Chart from 'react-apexcharts';
import chartData from 'config/constants/chart/token';

import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

import { useTheme } from '@mui/material/styles';

import { APIContext } from 'contexts/api';
import { formatNumber } from 'utils/bigNumber';

const TokenChart = (props: any) => {
    const { inputToken, outputToken } = props;

    const theme = useTheme();

    const { tokens, activeCurrency } = useContext(APIContext);

    const [prices, setPrices] = useState<any>([]);
    const [range, setRange] = useState<string>('1');

    const handleRangeChange = (event: React.SyntheticEvent, newValue: string) => {
        setRange(newValue);
    };

    const updateChart = () => {
        try {
            axios
                .get(
                    `https://api.coingecko.com/api/v3/coins/${inputToken.apiId}/market_chart?vs_currency=${activeCurrency}&days=${range}`
                )
                .then(({ data }) => {
                    const { prices: priceData } = data;
                    setPrices(priceData);
                });
        } catch {}
    };

    const series = useMemo(() => {
        if (!prices.length) return [];
        if (!tokens[inputToken.apiId] || !tokens[outputToken.apiId]) return [];
        const output = tokens[outputToken.apiId];
        const mPrices = prices.map(([timestamp, price]) => [timestamp, price / output.current_price]);
        return [
            {
                type: 'area',
                name: `${inputToken.symbol}/${outputToken.symbol}`,
                data: mPrices ?? []
            }
        ];
    }, [prices, tokens, inputToken, outputToken]);

    useEffect(() => {
        if (!series.length) return;
        const newChartData = {
            ...chartData.options,
            tooltip: {
                theme: theme.palette.mode,
                x: {
                    format: 'MM/dd/yyyy, HH:mm:ss TT'
                },
                y: {
                    formatter: (value: number) => formatNumber(value, 10)
                }
            },
            grid: {
                borderColor: theme.palette.divider
            },
            colors: [true ? theme.palette.success.main : theme.palette.error.main, theme.palette.divider],
            fill: {
                type: 'gradient',
                gradient: {
                    shade: theme.palette.mode,
                    type: 'vertical',
                    shadeIntensity: 1,
                    opacityFrom: 0.75,
                    opacityTo: 0.1,
                    stops: [0, 90, 100]
                }
            },
            xaxis: {
                type: 'datetime',
                tickAmount: 24,
                labels: {
                    style: {
                        colors: theme.palette.text.secondary,
                        fontFamily: theme.typography.fontFamily,
                        fontSize: theme.typography.fontSize
                    },
                    datetimeFormatter: {
                        year: 'yyyy',
                        month: "MMM 'yy",
                        day: 'dd MMM',
                        hour: 'HH:mm'
                    }
                },
                axisTicks: {
                    show: true,
                    color: theme.palette.divider
                },
                axisBorder: {
                    show: true,
                    color: theme.palette.divider
                }
            },
            yaxis: {
                show: false
            }
        };
        ApexCharts.exec(`token-info-chart`, 'updateOptions', newChartData);
    }, [theme, series, activeCurrency]);

    useEffect(() => {
        const interval = setInterval(() => {
            updateChart();
        }, 12000);
        updateChart();
        return () => clearInterval(interval);
    }, [inputToken, outputToken, range, activeCurrency, tokens]);

    return (
        <>
            {series.length ? (
                <>
                    <Stack
                        justifyContent="flex-end"
                        direction="row"
                        alignItems="center"
                        sx={{
                            padding: theme.spacing(1, 2),
                            '& .MuiTabs-root': {
                                padding: theme.spacing(0.5),
                                bgcolor: 'background.paper',
                                minHeight: 40,
                                borderRadius: 1,
                                '& .MuiTabs-flexContainer': {
                                    position: 'relative',
                                    zIndex: 2
                                },
                                '& .MuiTabs-indicator': {
                                    bgcolor: 'background.default',
                                    height: '100%',
                                    zIndex: 1,
                                    borderRadius: 1
                                },
                                '& button': {
                                    minWidth: 0,
                                    minHeight: 40
                                }
                            }
                        }}
                    >
                        <Tabs value={range} onChange={handleRangeChange} aria-label="basic tabs example">
                            <Tab value="1" label="1D" />
                            <Tab value="7" label="7D" />
                            <Tab value="30" label="1M" />
                            <Tab value="90" label="3M" />
                            <Tab value="365" label="1Y" />
                            <Tab value="max" label="All" />
                        </Tabs>
                    </Stack>
                    <Box sx={{ position: 'relative', flexGrow: 1, p: 2, pb: 3, pt: 0 }}>
                        <Chart {...chartData} series={series} />
                    </Box>
                </>
            ) : (
                <Skeleton
                    animation="wave"
                    variant="rectangular"
                    sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 1
                    }}
                />
            )}
        </>
    );
};

export default TokenChart;
