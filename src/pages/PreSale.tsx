// ** React Methods ** //
import { useContext, useState, useEffect, useMemo } from 'react';

// ** Material UI Components ** //
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import useMediaQuery from '@mui/material/useMediaQuery';

// ** Extra Components ** //
import CountDown from 'components/Time/CountDown';
import { ToastDescriptionWithTx } from 'components/Toast';

// ** Contexts ** //
import pSaleAbi from 'config/abi/psale.json';
import { APIContext } from 'contexts/api';

// ** Utils ** //
import multicall from 'utils/multicall';
import { formatNumber, fromWei, toWei, toBigNumber, formatCurrency } from 'utils/bigNumber';

// ** Hooks ** //
import useAuth from 'hooks/useAuth';
import useToast from 'hooks/useToast';
import useConfig from 'hooks/useConfig';
import useActiveWeb3React from '../hooks/useActiveWeb3React';
import useCatchTxError from 'hooks/useCatchTxError';
import { useWalletModal } from 'components/WalletModal';
import { usePreSaleContract } from 'hooks/useContract';

// ** Types ** //
import { ThemeOptions } from '@mui/material';
import { BigNumber as EthersBigNumber } from '@ethersproject/bignumber';

const PreSale = () => {
    const [amount, setAmount] = useState<any>({});
    const [isWList, setIsWList] = useState(false);
    const [cMax, setCMax] = useState<string>();
    const [status, setStatus] = useState<any>({});
    const [distance, setDistance] = useState<number>();

    const { isDark } = useConfig();
    const { login, logout } = useAuth();
    const { toastError, toastSuccess } = useToast();
    const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError();
    const { onPresentConnectModal } = useWalletModal(login, logout);
    const { account, active } = useActiveWeb3React();
    const {
        tokens: { binancecoin },
        activeCurrency
    } = useContext(APIContext);

    const isMobile = useMediaQuery((theme: ThemeOptions) => theme.breakpoints.down('sm'));

    const preSaleContract = usePreSaleContract();

    // ** Functions ** //
    const reset = () => {
        setAmount({
            number: '',
            wei: ''
        });
    };
    const claim = async () => {
        const receipt = await fetchWithCatchTxError(() => {
            return preSaleContract.claim();
        });
        if (receipt?.status) {
            reset();
            toastSuccess(
                'Claimed',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    You have claimed your TEFI!
                </ToastDescriptionWithTx>
            );
        }
    };
    const invest = async () => {
        const am = amount.wei.toString();
        const receipt = await fetchWithCatchTxError(() => {
            return preSaleContract.invest({
                value: am
            });
        });
        if (receipt?.status) {
            reset();
            toastSuccess(
                'Invest',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    Your funds have been invested in the pool
                </ToastDescriptionWithTx>
            );
        }
    };
    const update = async () => {
        try {
            const methods = [
                'raised',
                'price',
                'endTime',
                'minInvestable',
                'maxInvestable',
                'hardcap',
                'saleEnabled',
                'saleEnded',
                'claimEnabled',
                'startTime',
                'timestamp',
                'startedSale'
            ];
            const calls = methods.map((method) => ({
                address: preSaleContract.address,
                name: method
            }));
            const psaleResult = await multicall(pSaleAbi, calls);
            psaleResult.forEach((value: EthersBigNumber | boolean, idx: number) => {
                setStatus((prevState) => ({
                    ...prevState,
                    [methods[idx]]: value[0]
                }));
            });
            if (account) {
                preSaleContract.claimable(account).then((result: EthersBigNumber) => {
                    setStatus((prevState) => ({
                        ...prevState,
                        claimable: result
                    }));
                });
                preSaleContract.invests(account).then(async (result: EthersBigNumber) => {
                    const max = await preSaleContract.maxInvestable();
                    const mb = toBigNumber(max);
                    const bb = toBigNumber(result);
                    const cmb = mb.minus(bb);
                    setCMax(cmb.toString());
                    setStatus((prevState) => ({
                        ...prevState,
                        invests: result
                    }));
                });
                preSaleContract.claimed(account).then((result: boolean) => {
                    setStatus((prevState) => ({
                        ...prevState,
                        claimed: result
                    }));
                });
                preSaleContract.whitelist(account).then((result: boolean) => {
                    setIsWList(result);
                });
            }
        } catch (e: any) {
            e.message ? toastError(e.message) : toastError(`${e.toString().slice(0, 50)}...`);
        }
    };

    // ** Effect ** //
    useEffect(() => {
        const interval = setInterval(() => {
            update();
        }, 12000);
        update();
        return () => clearInterval(interval);
    }, [account, active]);

    useEffect(() => {
        if (!status.timestamp) return;
        if (distance) return;
        setDistance(getDistance(status.timestamp));
    }, [status.timestamp]);

    // ** Actions ** //
    const setMaxAmount = () => {
        setAmount({
            number: fromWei(cMax),
            wei: cMax
        });
    };
    const handleChange = (e) => {
        const value = e.target.value;
        const cm = fromWei(cMax);
        if (value < 0) {
            return setAmount({
                number: 0,
                wei: toWei('0')
            });
        }
        if (value > cm) {
            return setAmount({
                number: cm,
                wei: cMax
            });
        }
        return setAmount({
            number: value,
            wei: toWei(value)
        });
    };

    const getDistance = (timestamp: EthersBigNumber) => {
        const bTimestamp = Number(timestamp.toString());
        const cTimestamp = Math.floor(new Date().getTime() / 1000);
        return cTimestamp - bTimestamp;
    };

    const startTime = useMemo(() => {
        if (!status.startTime || !distance) return;
        return Number(status.startTime) + distance;
    }, [status.startTime, distance]);

    const endTime = useMemo(() => {
        if (!status.startTime || !distance) return;
        return Number(status.endTime) + distance;
    }, [status.endTime, distance]);

    return (
        <Container>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Card variant="outlined">
                        <CardContent
                            component={Stack}
                            alignItems="center"
                            spacing={1}
                            sx={{
                                py: 2,
                                px: 3
                            }}
                        >
                            <Box
                                component="img"
                                src={
                                    isDark
                                        ? require('assets/img/logo-wide-dark.png')
                                        : require('assets/img/logo-wide-light.png')
                                }
                                alt="TrueDefi Logo"
                                sx={{
                                    height: (theme) => theme.spacing(10)
                                }}
                            />
                            <Typography variant="h5">TRUEDEFI PRESALE</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent
                            sx={{
                                py: 2,
                                px: 3
                            }}
                        >
                            <Typography
                                variant="h6"
                                color="textSecondary"
                                sx={{
                                    textAlign: 'center',
                                    my: 2
                                }}
                            >
                                PreSale Detail
                            </Typography>
                            <Card variant="outlined" sx={{ mt: 2, boxShadow: 'none' }}>
                                <Table
                                    sx={{
                                        '& td, & th': {
                                            borderColor: 'divider',
                                            borderStyle: 'dashed',
                                            borderWidth: 1,
                                            borderLeft: 'none',
                                            borderRight: 'none',
                                            '&:nth-of-type(odd)': {
                                                bgcolor: 'rgb(255 255 255 / 2.5%)'
                                            }
                                        },
                                        '& tr': {
                                            '&:nth-of-type(1)': {
                                                '& td': {
                                                    borderTop: 'none'
                                                }
                                            },
                                            '&:nth-last-of-type(1)': {
                                                '& td': {
                                                    borderBottom: 'none'
                                                }
                                            }
                                        }
                                    }}
                                >
                                    {isMobile ? (
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>
                                                    <Typography variant="subtitle2">Price:</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack spacing={0.25}>
                                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                                            <Box
                                                                component="img"
                                                                sx={{
                                                                    height: (theme) => theme.spacing(2),
                                                                    width: (theme) => theme.spacing(2)
                                                                }}
                                                                src={require('../assets/img/bnb.png')}
                                                            />
                                                            <Typography variant="subtitle2">
                                                                {(() => {
                                                                    if (!status.price) {
                                                                        return (
                                                                            <Skeleton
                                                                                sx={{
                                                                                    minWidth: (theme) =>
                                                                                        theme.spacing(10)
                                                                                }}
                                                                                animation="wave"
                                                                            />
                                                                        );
                                                                    }
                                                                    return `${formatNumber(
                                                                        1 / fromWei(status.price, 5)
                                                                    )} BNB`;
                                                                })()}
                                                            </Typography>
                                                        </Stack>
                                                        <Typography variant="caption">
                                                            {(() => {
                                                                if (!status.price || !binancecoin) {
                                                                    return (
                                                                        <Skeleton
                                                                            sx={{
                                                                                minWidth: (theme) => theme.spacing(10)
                                                                            }}
                                                                            animation="wave"
                                                                        />
                                                                    );
                                                                }
                                                                return `≈ ${formatCurrency(
                                                                    binancecoin.current_price /
                                                                        fromWei(status.price, 5),
                                                                    activeCurrency
                                                                )}`;
                                                            })()}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>
                                                    <Typography variant="subtitle2">Raising:</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <Box
                                                            component="img"
                                                            sx={{
                                                                height: (theme) => theme.spacing(2.125),
                                                                width: (theme) => theme.spacing(2.125)
                                                            }}
                                                            src={require('../assets/img/bnb.png')}
                                                        />
                                                        <Typography variant="subtitle2">
                                                            {(() => {
                                                                if (!status.hardcap) {
                                                                    return (
                                                                        <Skeleton
                                                                            sx={{
                                                                                minWidth: (theme) => theme.spacing(10)
                                                                            }}
                                                                            animation="wave"
                                                                        />
                                                                    );
                                                                }
                                                                return `${formatNumber(fromWei(status.hardcap))} BNB`;
                                                            })()}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>
                                                    <Typography variant="subtitle2">Min:</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <Box
                                                            component="img"
                                                            sx={{
                                                                height: (theme) => theme.spacing(2.125),
                                                                width: (theme) => theme.spacing(2.125)
                                                            }}
                                                            src={require('../assets/img/bnb.png')}
                                                        />
                                                        <Typography variant="subtitle2">
                                                            {(() => {
                                                                if (!status.minInvestable) {
                                                                    return (
                                                                        <Skeleton
                                                                            sx={{
                                                                                minWidth: (theme) => theme.spacing(10)
                                                                            }}
                                                                            animation="wave"
                                                                        />
                                                                    );
                                                                }
                                                                return `${formatNumber(
                                                                    fromWei(status.minInvestable)
                                                                )} BNB`;
                                                            })()}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>
                                                    <Typography variant="subtitle2">Max:</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <Box
                                                            component="img"
                                                            sx={{
                                                                height: (theme) => theme.spacing(2.125),
                                                                width: (theme) => theme.spacing(2.125)
                                                            }}
                                                            src={require('../assets/img/bnb.png')}
                                                        />
                                                        <Typography variant="subtitle2">
                                                            {(() => {
                                                                if (!status.maxInvestable) {
                                                                    return (
                                                                        <Skeleton
                                                                            sx={{
                                                                                minWidth: (theme) => theme.spacing(10)
                                                                            }}
                                                                            animation="wave"
                                                                        />
                                                                    );
                                                                }
                                                                return `${formatNumber(
                                                                    fromWei(status.maxInvestable)
                                                                )} BNB`;
                                                            })()}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                            {(() => {
                                                if (!status.saleEnabled || !startTime || !endTime) {
                                                    return (
                                                        <TableRow>
                                                            <TableCell>
                                                                <Typography variant="subtitle2">Start:</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Skeleton variant="rectangular" animation="wave" />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }
                                                if (status.saleEnded) {
                                                    return (
                                                        <TableRow>
                                                            <TableCell>
                                                                <Typography variant="subtitle2">End:</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="subtitle2">Sale Ended</Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }
                                                if (!status.startedSale) {
                                                    return (
                                                        <TableRow>
                                                            <TableCell>
                                                                <Typography variant="subtitle2">Start:</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <CountDown
                                                                    callback={update}
                                                                    spacing={0.5}
                                                                    units={{
                                                                        isDay: true,
                                                                        isHour: true,
                                                                        isMinute: true,
                                                                        isSecond: true
                                                                    }}
                                                                    endTime={startTime}
                                                                    size={36}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }
                                                return (
                                                    <TableRow>
                                                        <TableCell>
                                                            <Typography variant="subtitle2">End:</Typography>
                                                        </TableCell>
                                                        <TableCell colSpan={3}>
                                                            <CountDown
                                                                callback={update}
                                                                spacing={0.5}
                                                                units={{
                                                                    isDay: true,
                                                                    isHour: true,
                                                                    isMinute: true,
                                                                    isSecond: true
                                                                }}
                                                                endTime={endTime}
                                                                size={36}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })()}
                                        </TableBody>
                                    ) : (
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>
                                                    <Typography>Price:</Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1 }}>
                                                    <Stack spacing={0.25}>
                                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                                            <Box
                                                                component="img"
                                                                sx={{
                                                                    height: (theme) => theme.spacing(2.125),
                                                                    width: (theme) => theme.spacing(2.125)
                                                                }}
                                                                src={require('../assets/img/bnb.png')}
                                                            />
                                                            <Typography>
                                                                {(() => {
                                                                    if (!status.price) {
                                                                        return (
                                                                            <Skeleton
                                                                                sx={{
                                                                                    minWidth: (theme) =>
                                                                                        theme.spacing(10)
                                                                                }}
                                                                                animation="wave"
                                                                            />
                                                                        );
                                                                    }
                                                                    return `${formatNumber(
                                                                        1 / fromWei(status.price, 5)
                                                                    )} BNB`;
                                                                })()}
                                                            </Typography>
                                                        </Stack>
                                                        <Typography variant="caption">
                                                            {(() => {
                                                                if (!status.price || !binancecoin) {
                                                                    return (
                                                                        <Skeleton
                                                                            sx={{
                                                                                minWidth: (theme) => theme.spacing(10)
                                                                            }}
                                                                            animation="wave"
                                                                        />
                                                                    );
                                                                }
                                                                return `≈ ${formatCurrency(
                                                                    binancecoin.current_price /
                                                                        fromWei(status.price, 5),
                                                                    activeCurrency
                                                                )}`;
                                                            })()}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography>Raising:</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <Box
                                                            component="img"
                                                            sx={{
                                                                height: (theme) => theme.spacing(2.125),
                                                                width: (theme) => theme.spacing(2.125)
                                                            }}
                                                            src={require('../assets/img/bnb.png')}
                                                        />
                                                        <Typography>
                                                            {(() => {
                                                                if (!status.hardcap) {
                                                                    return (
                                                                        <Skeleton
                                                                            sx={{
                                                                                minWidth: (theme) => theme.spacing(10)
                                                                            }}
                                                                            animation="wave"
                                                                        />
                                                                    );
                                                                }
                                                                return `${formatNumber(fromWei(status.hardcap))} BNB`;
                                                            })()}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>
                                                    <Typography>Min:</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <Box
                                                            component="img"
                                                            sx={{
                                                                height: (theme) => theme.spacing(2.125),
                                                                width: (theme) => theme.spacing(2.125)
                                                            }}
                                                            src={require('../assets/img/bnb.png')}
                                                        />
                                                        <Typography>
                                                            {(() => {
                                                                if (!status.minInvestable) {
                                                                    return (
                                                                        <Skeleton
                                                                            sx={{
                                                                                minWidth: (theme) => theme.spacing(10)
                                                                            }}
                                                                            animation="wave"
                                                                        />
                                                                    );
                                                                }
                                                                return `${formatNumber(
                                                                    fromWei(status.minInvestable)
                                                                )} BNB`;
                                                            })()}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography>Max:</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <Box
                                                            component="img"
                                                            sx={{
                                                                height: (theme) => theme.spacing(2.125),
                                                                width: (theme) => theme.spacing(2.125)
                                                            }}
                                                            src={require('../assets/img/bnb.png')}
                                                        />
                                                        <Typography>
                                                            {(() => {
                                                                if (!status.maxInvestable) {
                                                                    return (
                                                                        <Skeleton
                                                                            sx={{
                                                                                minWidth: (theme) => theme.spacing(10)
                                                                            }}
                                                                            animation="wave"
                                                                        />
                                                                    );
                                                                }
                                                                return `${formatNumber(
                                                                    fromWei(status.maxInvestable)
                                                                )} BNB`;
                                                            })()}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                            {(() => {
                                                if (!status.saleEnabled || !startTime || !endTime) {
                                                    return (
                                                        <TableRow>
                                                            <TableCell>
                                                                <Typography>Start of Sale:</Typography>
                                                            </TableCell>
                                                            <TableCell colSpan={3}>
                                                                <Skeleton variant="rectangular" animation="wave" />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }
                                                if (!status.startedSale) {
                                                    return (
                                                        <TableRow>
                                                            <TableCell>
                                                                <Typography>Start of Sale:</Typography>
                                                            </TableCell>
                                                            <TableCell colSpan={3}>
                                                                <CountDown
                                                                    callback={update}
                                                                    endTime={startTime}
                                                                    size={40}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }
                                                if (status.saleEnded) {
                                                    return (
                                                        <TableRow>
                                                            <TableCell>
                                                                <Typography>End Of Sale:</Typography>
                                                            </TableCell>
                                                            <TableCell colSpan={3}>
                                                                <Typography>Sale Ended</Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }
                                                return (
                                                    <TableRow>
                                                        <TableCell>
                                                            <Typography>End of Sale:</Typography>
                                                        </TableCell>
                                                        <TableCell colSpan={3}>
                                                            <CountDown callback={update} endTime={endTime} size={40} />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })()}
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    sx={{
                                                        bgcolor: 'transparent !important'
                                                    }}
                                                >
                                                    <Typography color="textSecondary">
                                                        Presale investors are purchasing at the same price as launch
                                                        (1BNB = 1,000 TEFI) which mitigates the temptation to sell early
                                                        into the project. The inflationary nature of the token will help
                                                        to manage any massive parabolic spikes, and will encourage a
                                                        natural, steady, healthy chart growth over time as we quickly
                                                        integrate TrueDefi into an increasing number of defi projects.
                                                        Contributions were limited to 5 BNB per individual or group, to
                                                        ensure a fair distribution of tokens.
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    )}
                                </Table>
                            </Card>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent
                            component={Stack}
                            justifyContent="space-between"
                            sx={{
                                px: 3,
                                height: '100%'
                            }}
                        >
                            <Typography
                                variant="h6"
                                color="textSecondary"
                                sx={{
                                    textAlign: 'center',
                                    my: 2
                                }}
                            >
                                {(() => {
                                    if (!status.saleEnabled) {
                                        return "Sale isn't enabled yet";
                                    }
                                    if (status.saleEnded) {
                                        return 'Sale Ended';
                                    }
                                    if (!startTime || !endTime) {
                                        return <Skeleton variant="rectangular" animation="wave" />;
                                    }
                                    if (!status.startedSale) {
                                        return "Sale isn't started yet";
                                    }
                                    return 'Current Sale Progress';
                                })()}
                            </Typography>
                            <Stack direction="row" alignItems="center" justifyContent="center">
                                {(() => {
                                    const percent = (status.raised / status.hardcap) * 100;
                                    const bufferPercent =
                                        ((Number(status.raised) + Number(amount.wei)) / status.hardcap) * 100;
                                    return (
                                        <LinearProgress
                                            variant={'buffer'}
                                            value={percent || 0}
                                            valueBuffer={bufferPercent || 0}
                                            sx={{
                                                width: '100%',
                                                borderColor: 'divider',
                                                borderStyle: 'solid',
                                                borderWidth: 1,
                                                height: (theme) => theme.spacing(5),
                                                borderRadius: '4px',
                                                '& .MuiLinearProgress-dashed': {
                                                    backgroundSize: '5px 5px'
                                                }
                                            }}
                                        />
                                    );
                                })()}
                                {status.raised && status.hardcap && (
                                    <Typography
                                        sx={{
                                            position: 'absolute'
                                        }}
                                    >
                                        {fromWei(status.raised)} BNB / {fromWei(status.hardcap)} BNB
                                    </Typography>
                                )}
                            </Stack>
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{
                                    paddingTop: 2,
                                    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                        margin: 0,
                                        WebkitAppearance: 'none'
                                    },
                                    '& input[type=number]': {
                                        MozAppearance: 'textfield'
                                    }
                                }}
                            >
                                <TextField
                                    type="number"
                                    inputProps={{
                                        min: 0,
                                        max: cMax ? fromWei(cMax) : 0,
                                        step: 0.01,
                                        placeholder: '0.00'
                                    }}
                                    disabled={!status.saleEnabled || status.saleEnded || pendingTx || !cMax}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Avatar
                                                    src={require('../assets/img/bnb.png')}
                                                    alt="bnb-token"
                                                    sx={{
                                                        mx: 1,
                                                        width: (theme) => theme.spacing(3.5),
                                                        height: (theme) => theme.spacing(3.5)
                                                    }}
                                                />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography color="textSecondary">BNB</Typography>
                                                    <Divider
                                                        orientation="vertical"
                                                        flexItem
                                                        sx={{
                                                            mx: '14px !important',
                                                            alignSelf: 'center',
                                                            minHeight: (theme) => theme.spacing(6)
                                                        }}
                                                    />
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={setMaxAmount}
                                                        disabled={
                                                            status.saleEnded ||
                                                            !cMax ||
                                                            fromWei(cMax) === amount.number ||
                                                            !status.saleEnabled
                                                        }
                                                        sx={{
                                                            margin: '0px !important'
                                                        }}
                                                    >
                                                        MAX
                                                    </Button>
                                                </Stack>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            bgcolor: 'background.default',
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.12) !important'
                                            }
                                        }
                                    }}
                                    sx={{
                                        flexGrow: 1,
                                        '& input': {
                                            textAlign: 'right',
                                            fontSize: (theme) => theme.spacing(2.5)
                                        }
                                    }}
                                    value={amount.number ?? ''}
                                    onChange={handleChange}
                                    helperText={
                                        status.maxInvestable ? `MAX LIMIT: ${fromWei(status.maxInvestable)} BNB` : ''
                                    }
                                    FormHelperTextProps={{
                                        sx: {
                                            textAlign: 'right'
                                        }
                                    }}
                                />
                            </Stack>
                            <Card variant="outlined" sx={{ mt: 2, boxShadow: 'none' }}>
                                <Table
                                    sx={{
                                        '& td, & th': {
                                            borderColor: 'divider',
                                            borderStyle: 'dashed',
                                            borderWidth: 1,
                                            borderLeft: 'none',
                                            borderRight: 'none',
                                            '&:nth-of-type(odd)': {
                                                bgcolor: 'rgb(255 255 255 / 2.5%)'
                                            }
                                        },
                                        '& tr': {
                                            '&:nth-of-type(1)': {
                                                '& td': {
                                                    borderTop: 'none'
                                                }
                                            },
                                            '&:nth-last-of-type(1)': {
                                                '& td': {
                                                    borderBottom: 'none'
                                                }
                                            }
                                        }
                                    }}
                                >
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>
                                                <Typography color="textSecondary" variant="subtitle2">
                                                    Amount per BNB
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack alignItems={'flex-end'}>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <Box
                                                            component="img"
                                                            sx={{
                                                                height: (theme) => theme.spacing(2.125)
                                                            }}
                                                            src={require('../assets/img/tefi.png')}
                                                        />
                                                        <Typography
                                                            sx={{
                                                                fontSize: (theme) => theme.spacing(2),
                                                                fontWeight: '500'
                                                            }}
                                                        >
                                                            {(() => {
                                                                if (!status.price) {
                                                                    return (
                                                                        <Skeleton
                                                                            sx={{
                                                                                minWidth: (theme) => theme.spacing(10)
                                                                            }}
                                                                            animation="wave"
                                                                        />
                                                                    );
                                                                }
                                                                return `${formatNumber(fromWei(status.price, 5))} TEFI`;
                                                            })()}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>
                                                <Typography color="textSecondary" variant="subtitle2">
                                                    Pledged
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack alignItems={'flex-end'}>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <Box
                                                            component="img"
                                                            sx={{
                                                                height: (theme) => theme.spacing(2.125)
                                                            }}
                                                            src={require('../assets/img/bnb.png')}
                                                        />
                                                        <Typography
                                                            sx={{
                                                                fontSize: (theme) => theme.spacing(2),
                                                                fontWeight: '500'
                                                            }}
                                                        >
                                                            {(() => {
                                                                if (!status.invests) {
                                                                    return (
                                                                        <Skeleton
                                                                            sx={{
                                                                                minWidth: (theme) => theme.spacing(10)
                                                                            }}
                                                                            animation="wave"
                                                                        />
                                                                    );
                                                                }
                                                                return `${formatNumber(fromWei(status.invests))} BNB`;
                                                            })()}
                                                        </Typography>
                                                    </Stack>
                                                    <Typography color="textSecondary" variant="caption">
                                                        {(() => {
                                                            if (!status.invests || !binancecoin) {
                                                                return (
                                                                    <Skeleton
                                                                        sx={{
                                                                            minWidth: (theme) => theme.spacing(10)
                                                                        }}
                                                                        animation="wave"
                                                                    />
                                                                );
                                                            }
                                                            return `≈ ${formatCurrency(
                                                                fromWei(status.invests) * binancecoin.current_price,
                                                                activeCurrency
                                                            )}`;
                                                        })()}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>
                                                <Typography color="textSecondary" variant="subtitle2">
                                                    You will receive
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack alignItems={'flex-end'}>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <Box
                                                            component="img"
                                                            sx={{
                                                                height: (theme) => theme.spacing(2.125)
                                                            }}
                                                            src={require('../assets/img/tefi.png')}
                                                        />
                                                        <Typography
                                                            sx={{
                                                                fontSize: (theme) => theme.spacing(2),
                                                                fontWeight: '500'
                                                            }}
                                                        >
                                                            {(() => {
                                                                if (!status.invests || !status.price) {
                                                                    return (
                                                                        <Skeleton
                                                                            sx={{
                                                                                minWidth: (theme) => theme.spacing(10)
                                                                            }}
                                                                            animation="wave"
                                                                        />
                                                                    );
                                                                }
                                                                const pb = toBigNumber(status.price);
                                                                const tpb = fromWei(
                                                                    pb.multipliedBy(toBigNumber(status.invests))
                                                                );
                                                                return `${formatNumber(fromWei(tpb, 5))} TEFI`;
                                                            })()}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Card>
                            {(() => {
                                if (!account) {
                                    return (
                                        <Button
                                            startIcon={
                                                <Box
                                                    component="img"
                                                    src={require('../assets/img/icons/wallet.svg').default}
                                                    alt="Wallet"
                                                    sx={{
                                                        width: (theme) => theme.spacing(2.5)
                                                    }}
                                                />
                                            }
                                            fullWidth
                                            onClick={onPresentConnectModal}
                                            size="large"
                                            variant="contained"
                                            sx={{
                                                marginTop: 2
                                            }}
                                        >
                                            Connect Wallet
                                        </Button>
                                    );
                                }
                                if (!isWList) {
                                    return (
                                        <Button
                                            fullWidth
                                            size="large"
                                            variant="contained"
                                            disabled
                                            sx={{
                                                marginTop: 2
                                            }}
                                        >
                                            Your wallet is not whitelisted
                                        </Button>
                                    );
                                }
                                if (!status.startedSale) {
                                    return (
                                        <LoadingButton
                                            fullWidth
                                            size="large"
                                            variant="contained"
                                            disabled
                                            sx={{
                                                marginTop: 2
                                            }}
                                        >
                                            Sale isn't started yet
                                        </LoadingButton>
                                    );
                                }
                                if (!status.saleEnabled) {
                                    return (
                                        <Button
                                            fullWidth
                                            size="large"
                                            variant="contained"
                                            disabled
                                            sx={{
                                                marginTop: 2
                                            }}
                                        >
                                            PreSale is not enabled yet.
                                        </Button>
                                    );
                                }
                                if (!status.saleEnded) {
                                    return (
                                        <LoadingButton
                                            fullWidth
                                            loading={pendingTx}
                                            size="large"
                                            variant="contained"
                                            sx={{
                                                marginTop: 2
                                            }}
                                            onClick={invest}
                                            disabled={
                                                !amount.number ||
                                                amount.number <= 0 ||
                                                amount.number > 5 ||
                                                !status.price
                                            }
                                        >
                                            Invest
                                        </LoadingButton>
                                    );
                                }
                                if (status.claimed) {
                                    return (
                                        <LoadingButton
                                            fullWidth
                                            size="large"
                                            variant="contained"
                                            disabled
                                            sx={{
                                                marginTop: 2
                                            }}
                                        >
                                            Already Claimed
                                        </LoadingButton>
                                    );
                                }
                                if (!fromWei(status.claimable ?? 0)) {
                                    return (
                                        <LoadingButton
                                            fullWidth
                                            disabled
                                            size="large"
                                            variant="contained"
                                            sx={{
                                                marginTop: 2
                                            }}
                                        >
                                            YOU DIDN'T INVEST
                                        </LoadingButton>
                                    );
                                }
                                return (
                                    <LoadingButton
                                        fullWidth
                                        loading={pendingTx}
                                        size="large"
                                        variant="contained"
                                        disabled={!status.claimEnabled}
                                        onClick={claim}
                                        sx={{
                                            marginTop: 2
                                        }}
                                    >
                                        Claim
                                    </LoadingButton>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default PreSale;
