// ** React Methods ** //
import { useContext, useEffect, useMemo, useState } from 'react';

// ** Material UI Components ** //
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import useMediaQuery from '@mui/material/useMediaQuery';

// ** Material UI Icons ** //
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';

// ** Contexts ** //
import { APIContext } from 'contexts/api';

// ** Utils ** //
import { ethersToBigNumber, formatCurrency, formatNumber, fromWei, toBigNumber } from 'utils/bigNumber';

// ** Hooks ** //
import useActiveWeb3React from 'hooks/useActiveWeb3React';
import { useMainTokenContract, useRouterContract, useSwapContract } from 'hooks/useContract';
import { useNavigate } from 'react-router-dom';

// ** Config ** //
import { MAX_RATE, PER_PAGE } from 'config';

// ** Types ** //
import { ThemeOptions } from '@mui/material';
import tokens from 'config/constants/tokens';

const Airdrop = () => {
    const navigate = useNavigate();
    const {
        tokens: { binancecoin },
        activeCurrency
    } = useContext(APIContext);
    const { account } = useActiveWeb3React();

    const isMobile = useMediaQuery((theme: ThemeOptions) => theme.breakpoints.down('sm'));

    const [bs, setBS] = useState<any>({});
    const [data, setData] = useState<any>({});
    const [date, setDate] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [endTimer, setEndTimer] = useState<any>({});
    const [score, setScore] = useState<any>();

    const swapContract = useSwapContract('tefi');
    const tokenContract = useMainTokenContract();
    const routerContract = useRouterContract();

    const buyTefi = () => {
        navigate('/swap');
    };

    const updateData = () => {
        [0, 1, 2].forEach(async (index) => {
            const buyers = await swapContract.getBuyers(index);
            const sellers = await swapContract.getSellers(index);
            setBS((prevState) => ({
                ...prevState,
                [index]: {
                    buyers,
                    sellers
                }
            }));
        });
    };

    const update = () => {
        updateData();
        swapContract.getBuyersCount(date).then((result) => {
            setData((prevState) => ({
                ...prevState,
                count: result
            }));
        });
        if (!account) return;
        tokenContract.balanceOf(account).then((result) =>
            setData((prevState) => ({
                ...prevState,
                balance: result
            }))
        );
        if (!binancecoin) return;
        routerContract.getAmountsOut(100000, [tokens.tefi.address, tokens.bnb.address]).then((result: string[]) => {
            const priceInBNB = result[1];
            const priceInFiat = fromWei(priceInBNB) * binancecoin.current_price;
            setData((prevState) => ({
                ...prevState,
                price: priceInFiat
            }));
        });
    };

    const handleDate = (event: React.MouseEvent<HTMLElement>, value: number) => {
        if (value !== null) {
            setPage(1);
            setDate(value);
        }
    };
    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => setPage(value);

    const getTrophyColor = (rank: number) => {
        if (rank === 1) return '#FFD700';
        if (rank === 2) return '#C0C0C0';
        if (rank === 3) return '#CD7F32';
        return '#CD7F32';
    };
    const getRankTime = () => {
        const delta = 60 * 60 * 24 * 2 + 60 * 60 * 7;
        const current_timestamp = Math.floor(new Date().getTime() / 1000);
        const secondsForWeek = 60 * 60 * 24 * 7;
        let endTime = current_timestamp - (current_timestamp % secondsForWeek) + delta;
        if (endTime < current_timestamp) endTime += secondsForWeek;
        return endTime;
    };
    const endTime = useMemo(getRankTime, []);

    const [buyersList, buyersCount] = useMemo(() => {
        if (!score) return [[]];
        const zero = toBigNumber(0);
        switch (date) {
            case 0: {
                if (!bs[0]) return [[]];
                const { buyers, sellers } = bs[0];
                const array = [];
                buyers[0].forEach((address, index) => {
                    const bv = ethersToBigNumber(buyers[1][index]);
                    const ids = sellers[0].findIndex((item) => item === address);
                    let volume = bv;
                    let sVolume = toBigNumber(0);
                    if (ids >= 0) {
                        const sv = ethersToBigNumber(sellers[1][ids]);
                        volume = volume.minus(sv);
                        sVolume = sVolume.plus(sv);
                    }
                    array.push({
                        address: address,
                        volume: volume.gt(zero) ? volume : zero,
                        bVolume: bv,
                        sVolume
                    });
                });
                array.sort((a, b) => b.volume - a.volume);
                const final = array.map((item, idx) => ({
                    ...item,
                    rank: idx + 1,
                    score: score[idx]
                }));
                return [final, final.length];
            }
            case 1:
            case 2: {
                if (!bs[date - 1] || !bs[date]) return [[]];
                const { sellers: cSellers } = bs[date - 1];
                const { buyers, sellers } = bs[date];
                const array = [];
                buyers[0].forEach((address: string, index: number) => {
                    const bv = ethersToBigNumber(buyers[1][index]);
                    const ids = sellers[0].findIndex((item: string) => item === address);
                    const idsc = cSellers[0].findIndex((item: string) => item === address);
                    let volume = bv;
                    let sVolume = toBigNumber(0);
                    if (ids >= 0) {
                        const sv = ethersToBigNumber(sellers[1][ids]);
                        volume = volume.minus(sv);
                        sVolume = sVolume.plus(sv);
                    }
                    if (idsc >= 0) {
                        const svc = ethersToBigNumber(cSellers[1][idsc]);
                        volume = volume.minus(svc);
                        sVolume = sVolume.plus(svc);
                    }
                    array.push({
                        address: address,
                        volume: volume.gt(zero) ? volume : zero,
                        bVolume: bv,
                        sVolume
                    });
                });
                array.sort((a, b) => b.volume - a.volume);
                const final = array.map((item, idx) => ({
                    ...item,
                    rank: idx + 1,
                    score: score[idx]
                }));
                return [final, final.length];
            }
            default: {
                return [[]];
            }
        }
    }, [bs, score]);

    const pageData = useMemo(() => {
        const filtered = buyersList.filter((item) => item.rank > (page - 1) * PER_PAGE && item.rank <= page * PER_PAGE);
        return filtered;
    }, [buyersList, page]);

    const accountInfo = useMemo(() => {
        if (!account) return {};
        return (
            buyersList.find((item) => item.address === account) ?? {
                rank: 0,
                volume: 0,
                score: 0
            }
        );
    }, [buyersList, account]);

    const updateScore = (count: any) => {
        if (Number(count) === 0) return;
        let distance = 40;
        let temp_score = {};
        const set = () => {
            let rate = MAX_RATE;
            let i = 0;
            while (rate >= 0) {
                const sc = rate;
                if (i === 0) {
                    temp_score[0] = sc;
                } else {
                    for (let k = Math.pow(2, i - 1); k < Math.pow(2, i); k++) {
                        temp_score[k] = sc;
                    }
                }
                i++;
                rate -= distance * i;
                if (rate === 0) rate--;
                if (count <= Math.pow(2, i)) break;
            }
            if (rate < 0 && count <= Math.pow(2, i)) return 0;
            else if (rate >= 0) return 1;
            else return -1;
        };
        while (true) {
            const result = set();
            if (result === 0) {
                setScore(temp_score);
                break;
            }
            if (result < 0) distance--;
            else distance++;
        }
    };

    useEffect(() => {
        update();
    }, [account, binancecoin, date]);

    useEffect(() => {
        if (!data.count) return;
        updateScore(data.count);
    }, [data.count]);

    useEffect(() => {
        if (!endTime) return;
        const exTime = endTime * 1000;
        const updateTime = () => {
            const now = new Date().getTime();
            const dis = exTime - now;
            const minDis = Math.floor(dis / 1000 / 60);
            const minutesForWeek = 60 * 24 * 7;
            // Time calculations for days, hours, minutes and seconds
            const days = Math.floor(dis / (1000 * 60 * 60 * 24));
            const hours = Math.floor((dis % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((dis % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((dis % (1000 * 60)) / 1000);

            // If the count down is finished, write some text
            if (dis < 0) {
                clearInterval(interval);
            }
            setEndTimer({
                minDisPercent: (minDis / minutesForWeek) * 100,
                minDis: minDis,
                days,
                hours,
                minutes,
                seconds
            });
        };
        const interval = setInterval(() => {
            updateTime();
        }, 1000 * 60);
        updateTime();
        return () => clearInterval(interval);
    }, [endTime]);
    return (
        <Container>
            <Grid container spacing={4}>
                <Grid item xs={12} sm={12}>
                    <Card sx={{ boxShadow: 'none', bgcolor: 'transparent' }}>
                        <CardContent
                            component={Stack}
                            direction={'column'}
                            spacing={0.25}
                            sx={{
                                padding: isMobile ? '0px 32px !important' : '32px !important'
                            }}
                        >
                            <Typography
                                variant={isMobile ? 'h5' : 'h3'}
                                sx={{
                                    fontWeight: 'bold',
                                    transform: isMobile ? 'none' : 'skewY(358deg)',
                                    textAlign: !isMobile ? 'left' : 'center'
                                }}
                            >
                                Volume is key,
                            </Typography>
                            <Typography
                                variant={isMobile ? 'h5' : 'h3'}
                                sx={{
                                    fontWeight: 'bold',
                                    transform: isMobile ? 'none' : 'skewY(358deg)',
                                    textAlign: !isMobile ? 'center' : 'center'
                                }}
                            >
                                The more you buy,
                            </Typography>
                            <Typography
                                variant={isMobile ? 'h5' : 'h3'}
                                sx={{
                                    fontWeight: 'bold',
                                    transform: isMobile ? 'none' : 'skewY(358deg)',
                                    textAlign: !isMobile ? 'right' : 'center'
                                }}
                            >
                                The more you receive!
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent
                            component={Stack}
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-around"
                            spacing={2}
                            sx={{
                                padding: '32px !important',
                                height: '100%'
                            }}
                        >
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" justifyContent="center" spacing={0.5}>
                                <Typography sx={{ fontSize: 13, color: '#a7c9ee' }}>Price</Typography>
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
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" justifyContent="center" spacing={0.5}>
                                <Typography sx={{ fontSize: 13, color: '#a7c9ee' }}>Your Balance</Typography>
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
                                        </Stack>
                                    );
                                })()}
                            </Stack>
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" justifyContent="center" spacing={0.5}>
                                <Typography sx={{ fontSize: 13, color: '#a7c9ee' }}>Your Volume</Typography>
                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                    {(() => {
                                        if (accountInfo.volume === 0) {
                                            return 0;
                                        }
                                        if (!accountInfo.volume) {
                                            return (
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            );
                                        }
                                        return formatNumber(fromWei(accountInfo.volume, tokens.tefi.decimals), 2);
                                    })()}
                                </Typography>
                            </Stack>
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" justifyContent="center" spacing={0.5}>
                                <Typography sx={{ fontSize: 13, color: '#a7c9ee' }}>Your Rank</Typography>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    {accountInfo.rank <= 4 && accountInfo.rank > 0 && (
                                        <EmojiEventsRoundedIcon
                                            sx={{
                                                fontSize: (theme) => theme.typography.h4.fontSize,
                                                color: getTrophyColor(accountInfo.rank)
                                            }}
                                        />
                                    )}
                                    <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                        {(() => {
                                            if (accountInfo.rank === 0) {
                                                return '-';
                                            }
                                            if (!accountInfo.rank) {
                                                return (
                                                    <Skeleton
                                                        sx={{
                                                            minWidth: (theme) => theme.spacing(10)
                                                        }}
                                                        animation="wave"
                                                    />
                                                );
                                            }
                                            return `#${accountInfo.rank}`;
                                        })()}
                                    </Typography>
                                </Stack>
                            </Stack>
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" justifyContent="center" spacing={0.5}>
                                <Typography sx={{ fontSize: 13, color: '#a7c9ee' }}>Your Score</Typography>
                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                    {(() => {
                                        if (accountInfo.score === 0) {
                                            return '-';
                                        }
                                        if (!accountInfo.score) {
                                            return (
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            );
                                        }
                                        return `${accountInfo.score}`;
                                    })()}
                                </Typography>
                            </Stack>
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" justifyContent="center" spacing={0.5}>
                                <Typography sx={{ fontSize: 13, color: '#a7c9ee' }}>Total Buyers</Typography>
                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                    {(() => {
                                        if (!buyersCount) {
                                            return (
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            );
                                        }
                                        return buyersCount;
                                    })()}
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card variant="outlined">
                        <CardContent
                            component={Stack}
                            spacing={2}
                            justifyContent="space-between"
                            sx={{
                                height: '100%',
                                padding: '32px !important'
                            }}
                        >
                            <Stack sx={{ flexGrow: 1, position: 'relative' }} alignItems="center" spacing={2}>
                                <Box
                                    sx={{
                                        width: 290,
                                        height: 290,
                                        position: 'relative',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                >
                                    <CircularProgress
                                        thickness={22}
                                        variant="determinate"
                                        color="secondary"
                                        value={endTimer.minDisPercent ?? 0}
                                        size={290}
                                        sx={{
                                            position: 'absolute',
                                            '& svg': {
                                                width: '100%',
                                                height: '100%',
                                                borderColor: (theme) => theme.palette.secondary.main,
                                                borderWidth: (theme) => theme.spacing(2),
                                                borderStyle: 'solid',
                                                borderRadius: '50%',
                                                padding: (theme) => theme.spacing(1)
                                            },
                                            width: '100% !important',
                                            minWidth: 250,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                    />
                                    <CircularProgress
                                        thickness={22}
                                        variant="determinate"
                                        color="secondary"
                                        value={100}
                                        size={290}
                                        sx={{
                                            position: 'absolute',
                                            zIndex: -1,
                                            '& svg': {
                                                width: '100%',
                                                height: '100%',
                                                borderColor: (theme) => theme.palette.secondary.main,
                                                borderWidth: (theme) => theme.spacing(2),
                                                borderStyle: 'solid',
                                                borderRadius: '50%',
                                                padding: (theme) => theme.spacing(1)
                                            },
                                            width: '100% !important',
                                            minWidth: 250,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                    />
                                    <Stack
                                        sx={{
                                            width: 290,
                                            height: 290,
                                            zIndex: 10,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Typography variant="h3" sx={{ fontWeight: '600' }}>
                                            {endTimer.minDis ?? 0}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: 16,
                                                textAlign: 'center',
                                                color: '#a7c9ee'
                                            }}
                                        >
                                            Minutes
                                        </Typography>
                                    </Stack>
                                </Box>
                                <Typography variant="h6" sx={{ textAlign: 'center', py: 1.25 }}>
                                    {new Date(endTime * 1000).toLocaleString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        second: '2-digit',
                                        minute: '2-digit',
                                        hour12: false
                                    })}
                                </Typography>
                            </Stack>
                            <Stack spacing={1} direction={{ xs: 'column', sm: 'row' }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={buyTefi}
                                    startIcon={<ShoppingCartRoundedIcon />}
                                >
                                    BUY TEFI
                                </Button>
                                <Button
                                    component={Link}
                                    href="https://www.dextools.io/app/bnb/pair-explorer/0xff25d7cf6bfadb8be871c53ac534ba49808496de"
                                    underline="none"
                                    target="_blank"
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<ShowChartRoundedIcon />}
                                >
                                    VIEW CHART
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={8}>
                    <Card variant="outlined" sx={{ overflow: 'auto', position: 'relative' }}>
                        {!pageData.length && (
                            <Stack
                                spacing={2}
                                justifyContent="center"
                                alignItems="center"
                                sx={{
                                    width: '100%',
                                    height: 'calc(100% - 57px - 57px)',
                                    position: 'absolute',
                                    zIndex: 10,
                                    backdropFilter: 'blur(5px)',
                                    top: 57,
                                    left: 0
                                }}
                            >
                                <Box
                                    component="img"
                                    src={require('assets/img/icons/emptybox.png')}
                                    alt="Empty Box"
                                    sx={{
                                        opacity: 0.5,
                                        width: (theme) => theme.spacing(12)
                                    }}
                                />
                                <Typography color="textSecondary">No Data</Typography>
                            </Stack>
                        )}
                        {!bs[date] && (
                            <Stack
                                justifyContent="center"
                                alignItems="center"
                                sx={{
                                    width: '100%',
                                    height: 'calc(100% - 57px - 57px)',
                                    position: 'absolute',
                                    zIndex: 10,
                                    backdropFilter: 'blur(5px)',
                                    top: 57,
                                    left: 0
                                }}
                            >
                                <CircularProgress />
                            </Stack>
                        )}
                        <Table
                            sx={{
                                '& td, & th': {
                                    borderColor: 'divider',
                                    borderStyle: 'dashed',
                                    borderWidth: 1,
                                    borderLeft: 'none',
                                    borderRight: 'none',
                                    '&:nth-of-type(even)': {
                                        bgcolor: 'rgb(255 255 255 / 2.5%)'
                                    }
                                },
                                '& tr': {
                                    '&:nth-of-type(even)': {
                                        bgcolor: 'rgb(255 255 255 / 5%)'
                                    }
                                }
                            }}
                        >
                            <TableHead>
                                <TableRow
                                    sx={{
                                        bgcolor: (theme) => `${theme.palette.secondary.main}44`
                                    }}
                                >
                                    <TableCell sx={{ textAlign: 'left' }}>Rank</TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>Trader</TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>Buy Volume</TableCell>
                                    {!isMobile && <TableCell sx={{ textAlign: 'center' }}>Sell Volume</TableCell>}
                                    <TableCell sx={{ textAlign: 'right' }}>Score</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody sx={{ position: 'relative' }}>
                                {pageData.map((item) => {
                                    return (
                                        <TableRow
                                            key={item.rank}
                                            sx={{
                                                bgcolor:
                                                    item.address === account
                                                        ? (theme) => `${theme.palette.secondary.main} !important`
                                                        : 'inherit'
                                            }}
                                        >
                                            <TableCell sx={{ textAlign: 'left' }}>
                                                <Stack
                                                    direction={{
                                                        xs: 'column',
                                                        sm: 'row'
                                                    }}
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                >
                                                    {`#${item.rank}`}
                                                    {item.rank <= 4 && (
                                                        <EmojiEventsRoundedIcon
                                                            fontSize="small"
                                                            sx={{
                                                                color: getTrophyColor(item.rank)
                                                            }}
                                                        />
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                {isMobile
                                                    ? `${item.address.substring(0, 6)} ... ${item.address.substring(
                                                          item.address.length - 4
                                                      )}`
                                                    : item.address}
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                {formatNumber(fromWei(item.bVolume, tokens.tefi.decimals), 2)}
                                            </TableCell>
                                            {!isMobile && (
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    {formatNumber(fromWei(item.sVolume, tokens.tefi.decimals), 2)}
                                                </TableCell>
                                            )}
                                            <TableCell sx={{ textAlign: 'center' }}>{item.score}</TableCell>
                                        </TableRow>
                                    );
                                })}
                                {new Array(PER_PAGE - pageData.length).fill('Skeleton').map((item, idx) => {
                                    return (
                                        <TableRow key={idx} sx={{ visibility: 'hidden' }}>
                                            <TableCell>{item}</TableCell>
                                            <TableCell>
                                                {item}
                                                <IconButton component="span" size="small" sx={{ ml: 0.5 }}>
                                                    <ContentCopyRoundedIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>{item}</TableCell>
                                            {!isMobile && <TableCell>{item}</TableCell>}
                                            <TableCell>{idx}</TableCell>
                                        </TableRow>
                                    );
                                })}
                                <TableRow>
                                    <TableCell colSpan={5} sx={{ py: 1.5, borderBottom: 0 }}>
                                        <Stack
                                            spacing={2}
                                            direction={{ xs: 'column-reverse', sm: 'row' }}
                                            alignItems="center"
                                            justifyContent="space-between"
                                        >
                                            <ToggleButtonGroup
                                                size="small"
                                                color="primary"
                                                value={date}
                                                exclusive
                                                fullWidth={isMobile}
                                                onChange={handleDate}
                                            >
                                                <ToggleButton
                                                    value={2}
                                                    component={Button}
                                                    sx={{
                                                        textTransform: 'none',
                                                        height: 32
                                                    }}
                                                >
                                                    Finished
                                                </ToggleButton>
                                                <ToggleButton
                                                    value={1}
                                                    component={Button}
                                                    sx={{
                                                        textTransform: 'none',
                                                        height: 32
                                                    }}
                                                >
                                                    Previous Week
                                                </ToggleButton>
                                                <ToggleButton
                                                    value={0}
                                                    component={Button}
                                                    sx={{
                                                        textTransform: 'none',
                                                        height: 32
                                                    }}
                                                >
                                                    Current Week
                                                </ToggleButton>
                                            </ToggleButtonGroup>
                                            <Pagination
                                                count={data.count ? Math.ceil(data.count / PER_PAGE) : 0}
                                                page={page}
                                                onChange={handlePageChange}
                                                showLastButton
                                                siblingCount={0}
                                                boundaryCount={1}
                                                color="primary"
                                                shape="rounded"
                                                variant="outlined"
                                            />
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Airdrop;
