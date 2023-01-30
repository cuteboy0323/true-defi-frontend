// ** React Methods ** //
import { useContext, useEffect, useMemo, useState } from 'react';

// ** Material UI Components ** //
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import LoadingButton from '@mui/lab/LoadingButton';

// ** Material UI Icons ** //
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';

// ** Extra Components ** //
import CountDown from 'components/Time/CountDown';
import { ToastDescriptionWithTx } from 'components/Toast';

// ** Contexts ** //
import { APIContext } from 'contexts/api';

// ** Utils ** //
import { ethersToBigNumber, formatCurrency, formatNumber, fromWei, toBigNumber } from 'utils/bigNumber';

// ** Hooks ** //
import useToast from 'hooks/useToast';
import useActiveWeb3React from 'hooks/useActiveWeb3React';
import useCatchTxError from 'hooks/useCatchTxError';
import { useDividendContract, useRouterContract, useMainTokenContract } from 'hooks/useContract';
import { useNavigate } from 'react-router-dom';

// ** Config ** //
import tokens from 'config/constants/tokens';
import { Link } from '@mui/material';

const Dashboard = () => {
    const routerContract = useRouterContract();
    const tokenContract = useMainTokenContract();
    const dividendContract = useDividendContract();

    const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError();
    const { toastSuccess } = useToast();
    const navigate = useNavigate();
    const {
        tokens: { binancecoin },
        activeCurrency
    } = useContext(APIContext);

    const [data, setData] = useState<any>({});

    const { account } = useActiveWeb3React();

    // ** Functions ** //
    const buyTefi = () => {
        navigate('/swap');
    };

    const getBaseTime = () => {
        if (!data.nbase || !data.rebaseRate) return 0;
        const current_timestamp = new Date().getTime() / 1000;
        const last_rebased_timestamp = Number(data.nbase);
        const secondsFor15minutes = 60 * 15;
        const nextRebased = secondsFor15minutes - ((current_timestamp - last_rebased_timestamp) % secondsFor15minutes);
        if (data.rebaseRate > 0) return Math.floor(current_timestamp + nextRebased);
        else return Math.floor(current_timestamp);
    };

    const claim = async () => {
        const receipt = await fetchWithCatchTxError(() => {
            return dividendContract.claimDividend();
        });
        if (receipt?.status) {
            toastSuccess(
                'Claimed',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    You have claimed your rewards!
                </ToastDescriptionWithTx>
            );
        }
    };

    const update = () => {
        dividendContract.totalDistributed().then(async (result) => {
            const totalDividends = await dividendContract.totalDividends();
            const tAvailable = Number(totalDividends) - Number(result);
            setData((prevState) => ({
                ...prevState,
                tDistributed: result,
                tAvailable
            }));
        });
        tokenContract.getCurrentRabaseRate().then((result: string) => {
            const rebaseRate = Number(result);
            const secondsFor15minutes = 60 * 15;
            const secondsForDay = 60 * 60 * 24;
            const multiplier = secondsForDay / secondsFor15minutes;
            const wROI = ((1 + rebaseRate / 1e8) ** (multiplier * 7) - 1) * 100;
            const mROI = ((1 + rebaseRate / 1e8) ** (multiplier * 30) - 1) * 100;
            const aROI = ((1 + rebaseRate / 1e8) ** (multiplier * 365) - 1) * 100;
            setData((prevState) => ({
                ...prevState,
                rebaseRate: rebaseRate,
                wROI,
                mROI,
                aROI
            }));
        });
        tokenContract._lastRebasedTime().then((result) => {
            setData((prevState) => ({
                ...prevState,
                nbase: result
            }));
        });
        tokenContract.totalSupply().then((result) => {
            setData((prevState) => ({
                ...prevState,
                tsupply: result
            }));
        });
        if (account) {
            tokenContract.balanceOf(account).then((result) =>
                setData((prevState) => ({
                    ...prevState,
                    balance: result
                }))
            );
            dividendContract.getUnpaidEarnings(account).then((result) =>
                setData((prevState) => ({
                    ...prevState,
                    earning: result
                }))
            );
            dividendContract.shares(account).then(({ totalRealised }) => {
                setData((prevState) => ({
                    ...prevState,
                    earned: totalRealised
                }));
            });
        }
        if (!binancecoin) return;
        tokenContract.getCirculatingSupply().then(async (result: any) => {
            setData((prevState) => ({
                ...prevState,
                csupply: result
            }));
            const priceInBNB = (
                await routerContract.getAmountsOut(100000, [tokens.tefi.address, tokens.bnb.address])
            )[1];
            const priceInFiat = fromWei(priceInBNB) * binancecoin.current_price;
            const mcap = toBigNumber(priceInFiat).multipliedBy(ethersToBigNumber(result));
            setData((prevState) => ({
                ...prevState,
                mcap: mcap,
                price: priceInFiat
            }));
        });
    };

    // ** Memorizable Values ** //
    let nbaseTime = useMemo(getBaseTime, [data.nbase, data.rebaseRate]);
    nbaseTime = useMemo(getBaseTime, [nbaseTime < Math.floor(new Date().getTime() / 1000)]);

    // ** Side Effects ** //
    useEffect(() => {
        update();
    }, [binancecoin, activeCurrency, account]);

    return (
        <Container sx={{ py: 4 }}>
            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <Card variant="outlined">
                        <CardContent
                            component={Stack}
                            direction={{ xs: 'column', sm: 'row' }}
                            alignItems="center"
                            spacing={2}
                            sx={{
                                padding: '32px !important'
                            }}
                        >
                            <Stack spacing={2}>
                                <Button variant="contained" onClick={buyTefi} startIcon={<ShoppingCartRoundedIcon />}>
                                    BUY TEFI
                                </Button>
                                <Link
                                    href="https://www.dextools.io/app/bnb/pair-explorer/0xff25d7cf6bfadb8be871c53ac534ba49808496de"
                                    underline="none"
                                    target="_blank"
                                >
                                    <Button variant="outlined" startIcon={<ShowChartRoundedIcon />}>
                                        VIEW CHART
                                    </Button>
                                </Link>
                            </Stack>
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                <Typography
                                    sx={{
                                        fontSize: 13,
                                        color: (theme) => (theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main')
                                    }}
                                >
                                    Price
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                    {(() => {
                                        if (!data.price) {
                                            return (
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            );
                                        }
                                        return formatCurrency(data.price, activeCurrency, 3);
                                    })()}
                                </Typography>
                            </Stack>
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                <Typography
                                    sx={{
                                        fontSize: 13,
                                        color: (theme) => (theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main')
                                    }}
                                >
                                    Market Cap
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                    {(() => {
                                        if (!data.mcap) {
                                            return (
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            );
                                        }
                                        return formatCurrency(
                                            fromWei(data.mcap, tokens.tefi.decimals),
                                            activeCurrency,
                                            0
                                        );
                                    })()}
                                </Typography>
                            </Stack>
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                <Typography
                                    sx={{
                                        fontSize: 13,
                                        color: (theme) => (theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main')
                                    }}
                                >
                                    Circulating Supply
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                    {(() => {
                                        if (!data.csupply) {
                                            return (
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            );
                                        }
                                        return formatNumber(fromWei(data.csupply, tokens.tefi.decimals), 0);
                                    })()}
                                </Typography>
                            </Stack>
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                <Typography
                                    sx={{
                                        fontSize: 13,
                                        color: (theme) => (theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main')
                                    }}
                                >
                                    Total Supply
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                    {(() => {
                                        if (!data.tsupply) {
                                            return (
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            );
                                        }
                                        return formatNumber(fromWei(data.tsupply, tokens.tefi.decimals), 0);
                                    })()}
                                </Typography>
                            </Stack>
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                <Typography
                                    sx={{
                                        fontSize: 13,
                                        color: (theme) => (theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main')
                                    }}
                                >
                                    Auto Compounding
                                </Typography>
                                <CountDown
                                    endTime={nbaseTime}
                                    size={48}
                                    uvalue={{
                                        minutes: 15
                                    }}
                                    units={{
                                        isDay: false,
                                        isHour: false,
                                        isMinute: true,
                                        isSecond: true
                                    }}
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={9}>
                    <Stack sx={{ height: '100%' }}>
                        <Card variant="outlined" sx={{ flexGrow: 1 }}>
                            <CardContent
                                component={Stack}
                                direction={{ xs: 'column', sm: 'row' }}
                                alignItems="center"
                                spacing={2}
                                sx={{
                                    padding: '32px !important',
                                    height: '100%'
                                }}
                            >
                                <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            color: (theme) =>
                                                theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                        }}
                                    >
                                        Your Balance
                                    </Typography>
                                    {(() => {
                                        if (!data.balance) {
                                            return (
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    <Skeleton
                                                        sx={{
                                                            minWidth: (theme) => theme.spacing(10)
                                                        }}
                                                        animation="wave"
                                                    />
                                                </Typography>
                                            );
                                        }
                                        return (
                                            <Stack direction="row" alignItems="flex-end">
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    {formatNumber(fromWei(data.balance, tokens.tefi.decimals), 2)}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        ml: 0.5,
                                                        mb: 0.5
                                                    }}
                                                >
                                                    TEFI
                                                </Typography>
                                            </Stack>
                                        );
                                    })()}
                                </Stack>
                                <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            color: (theme) =>
                                                theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                        }}
                                    >
                                        Weekly ROI
                                    </Typography>
                                    {(() => {
                                        if (data.wROI >= 0) {
                                            return (
                                                <Stack direction="row" alignItems="flex-end">
                                                    <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                        {formatNumber(data.wROI, 2)}
                                                    </Typography>
                                                    <Typography
                                                        component="span"
                                                        sx={{
                                                            ml: 0.5,
                                                            mb: 0.5
                                                        }}
                                                    >
                                                        %
                                                    </Typography>
                                                </Stack>
                                            );
                                        }
                                        return (
                                            <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            </Typography>
                                        );
                                    })()}
                                </Stack>
                                <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            color: (theme) =>
                                                theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                        }}
                                    >
                                        Monthly ROI
                                    </Typography>
                                    {(() => {
                                        if (data.mROI >= 0) {
                                            return (
                                                <Stack direction="row" alignItems="flex-end">
                                                    <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                        {formatNumber(data.mROI, 2)}
                                                    </Typography>
                                                    <Typography
                                                        component="span"
                                                        sx={{
                                                            ml: 0.5,
                                                            mb: 0.5
                                                        }}
                                                    >
                                                        %
                                                    </Typography>
                                                </Stack>
                                            );
                                        }
                                        return (
                                            <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            </Typography>
                                        );
                                    })()}
                                </Stack>
                                <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            color: (theme) =>
                                                theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                        }}
                                    >
                                        Annual ROI
                                    </Typography>
                                    {(() => {
                                        if (data.aROI >= 0) {
                                            return (
                                                <Stack direction="row" alignItems="flex-end">
                                                    <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                        {formatNumber(data.aROI, 2)}
                                                    </Typography>
                                                    <Typography
                                                        component="span"
                                                        sx={{
                                                            ml: 0.5,
                                                            mb: 0.5
                                                        }}
                                                    >
                                                        %
                                                    </Typography>
                                                </Stack>
                                            );
                                        }
                                        return (
                                            <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            </Typography>
                                        );
                                    })()}
                                </Stack>
                            </CardContent>
                        </Card>
                        <Card variant="outlined" sx={{ mt: 4, flexGrow: 1 }}>
                            <CardContent
                                component={Stack}
                                direction={{ xs: 'column', sm: 'row' }}
                                alignItems={{ xs: 'center', sm: 'flex-start' }}
                                spacing={2}
                                sx={{
                                    padding: '32px !important',
                                    height: '100%'
                                }}
                            >
                                <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            color: (theme) =>
                                                theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                        }}
                                    >
                                        Total Distributed
                                    </Typography>
                                    {(() => {
                                        if (!data.tDistributed) {
                                            return (
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    <Skeleton
                                                        sx={{
                                                            minWidth: (theme) => theme.spacing(10)
                                                        }}
                                                        animation="wave"
                                                    />
                                                </Typography>
                                            );
                                        }
                                        return (
                                            <Stack direction="row" alignItems="flex-end">
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    {formatNumber(fromWei(data.tDistributed), 2)}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        ml: 0.5,
                                                        mb: 0.5
                                                    }}
                                                >
                                                    BUSD
                                                </Typography>
                                            </Stack>
                                        );
                                    })()}
                                </Stack>
                                <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            color: (theme) =>
                                                theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                        }}
                                    >
                                        Total Available
                                    </Typography>
                                    {(() => {
                                        if (!data.tAvailable) {
                                            return (
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    <Skeleton
                                                        sx={{
                                                            minWidth: (theme) => theme.spacing(10)
                                                        }}
                                                        animation="wave"
                                                    />
                                                </Typography>
                                            );
                                        }
                                        return (
                                            <Stack direction="row" alignItems="flex-end">
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    {formatNumber(fromWei(data.tAvailable), 2)}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        ml: 0.5,
                                                        mb: 0.5
                                                    }}
                                                >
                                                    BUSD
                                                </Typography>
                                            </Stack>
                                        );
                                    })()}
                                </Stack>
                                <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            color: (theme) =>
                                                theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                        }}
                                    >
                                        Total Earned
                                    </Typography>
                                    {(() => {
                                        if (!data.earned) {
                                            return (
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    <Skeleton
                                                        sx={{
                                                            minWidth: (theme) => theme.spacing(10)
                                                        }}
                                                        animation="wave"
                                                    />
                                                </Typography>
                                            );
                                        }
                                        return (
                                            <Stack direction="row" alignItems="flex-end">
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    {formatNumber(fromWei(data.earned), 2)}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        ml: 0.5,
                                                        mb: 0.5
                                                    }}
                                                >
                                                    BUSD
                                                </Typography>
                                            </Stack>
                                        );
                                    })()}
                                </Stack>
                                <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            color: (theme) =>
                                                theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                        }}
                                    >
                                        Pending Balance
                                    </Typography>
                                    {(() => {
                                        if (!data.earning) {
                                            return (
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    <Skeleton
                                                        sx={{
                                                            minWidth: (theme) => theme.spacing(10)
                                                        }}
                                                        animation="wave"
                                                    />
                                                </Typography>
                                            );
                                        }
                                        return (
                                            <Stack direction="row" alignItems="flex-end">
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    {formatNumber(fromWei(data.earning), 2)}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        ml: 0.5,
                                                        mb: 0.5
                                                    }}
                                                >
                                                    BUSD
                                                </Typography>
                                            </Stack>
                                        );
                                    })()}
                                    <LoadingButton
                                        loading={pendingTx}
                                        disabled={!account || !data.earning}
                                        onClick={claim}
                                        variant="outlined"
                                        size="small"
                                    >
                                        MANUAL CLAIM
                                    </LoadingButton>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent
                            sx={{
                                height: '100%',
                                padding: '32px !important'
                            }}
                        >
                            <Table
                                sx={{
                                    height: '100%',
                                    '& td': {
                                        borderColor: 'divider',
                                        borderStyle: 'dashed',
                                        borderWidth: 1
                                    }
                                }}
                            >
                                <TableBody>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                borderRight: 'none !important'
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: 13,
                                                    color: (theme) =>
                                                        theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                                }}
                                            >
                                                Buy Tax
                                            </Typography>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                borderLeft: 'none !important'
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    color: 'primary.main'
                                                }}
                                            >
                                                12%
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                borderRight: 'none !important'
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: 13,
                                                    color: (theme) =>
                                                        theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                                }}
                                            >
                                                Sell Tax
                                            </Typography>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                borderLeft: 'none !important'
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    color: 'primary.main'
                                                }}
                                            >
                                                16%
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                borderRight: 'none !important'
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: 13,
                                                    color: (theme) =>
                                                        theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                                }}
                                            >
                                                {' '}
                                                Transfer Tax
                                            </Typography>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                borderLeft: 'none !important'
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    color: 'primary.main'
                                                }}
                                            >
                                                0%
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard;
