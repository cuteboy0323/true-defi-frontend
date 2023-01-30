import React, { useEffect, useState } from 'react';

// ** Material UI Components ** //
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';

// ** Material UI Icons ** //
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';

import { multicallv2 } from 'utils/multicall';
import { ethersToBigNumber, formatNumber, fromWei } from 'utils/bigNumber';
import { useLaunchpadContract } from 'hooks/useContract';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { getBscScanLink } from 'utils';

import { useNavigate } from 'react-router-dom';
import useToast from 'hooks/useToast';
import useActiveWeb3React from 'hooks/useActiveWeb3React';

const Timer = ({ endTime, update }: any) => {
    const [time, setTime] = useState<any>(new Date().getTime() / 1000);

    useEffect(() => {
        if (!endTime) return;
        const exTime = Number(endTime) * 1000;
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = exTime - now;

            // Time calculations for days, hours, minutes and seconds
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // If the count down is finished, write some text
            if (distance < 0) {
                clearInterval(interval);
                update();
            }
            setTime({
                days: days < 10 ? `0${days}` : days,
                hours: hours < 10 ? `0${hours}` : hours,
                minutes: minutes < 10 ? `0${minutes}` : minutes,
                seconds: seconds < 10 ? `0${seconds}` : seconds
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [endTime]);
    return (
        <Typography variant="caption">
            {time.days}:{time.hours}:{time.minutes}:{time.seconds}
        </Typography>
    );
};

export const GetPoolsData = (props: any) => {
    const [status, setStatus] = useState<any>({});
    const [token, setToken] = useState<any>({});

    const launchpadContract = useLaunchpadContract();

    const updatePool = async () => {
        const methods = [
            'token',
            'hardcap',
            'softcap',
            'raised',
            'maxInvestable',
            'minInvestable',
            'startTime',
            'endTime',
            'price',
            'publicMode',
            'tokenOwner'
        ];
        const calls = methods.map((method) => ({
            address: props.item,
            name: method
        }));
        const poolResult = await multicallv2(require('config/abi/pool.json'), calls);
        poolResult.forEach((value: any, idx: number) => {
            setStatus((prevState) => ({
                ...prevState,
                [methods[idx]]: value[0]
            }));
        });
    };
    const updatePoolMap = () => {
        launchpadContract.poolMap(props.item).then((result: any) => {
            const { createdAt, logo } = result;
            setStatus((prevState) => ({
                ...prevState,
                logo,
                createdAt
            }));
        });
    };
    const updateToken = async () => {
        const methods = ['decimals', 'name', 'symbol'];
        const calls = methods.map((method) => ({
            address: status.token,
            name: method
        }));
        const tokenResult = await multicallv2(require('config/abi/bep20.json'), calls);
        tokenResult.forEach((value: any, idx: number) => {
            setToken((prevState) => ({
                ...prevState,
                [methods[idx]]: value[0]
            }));
        });
    };
    useEffect(() => {
        if (!status.token) return;
        updateToken();
    }, [status.token]);
    useEffect(() => {
        if (!props.item) return;
        updatePool();
        updatePoolMap();
    }, [props.item]);

    useEffect(() => {
        props.addPools(props.item, { status, token });
    }, [status, token]);

    return <></>;
};

const PresaleItem = ({ item, status, token, update }: any) => {
    const navigate = useNavigate();

    const { toastSuccess } = useToast();

    const { account } = useActiveWeb3React();

    return (
        <Grid item xs={12} sm={4}>
            <Card variant="outlined">
                <CardContent sx={{ p: 4 }}>
                    <Stack pb={3} direction="row" justifyContent="space-between" alignItems="center">
                        <Avatar
                            src={status.logo && status.logo !== '' ? status.logo : require('assets/img/tefi.png')}
                            alt="Tefi"
                            sx={{ width: 64, height: 64 }}
                        />
                        <Stack spacing={1} direction="row" alignItems="center">
                            <Stack direction="row" alignItems="center" spacing={0} justifyContent="flex-end">
                                <CopyToClipboard
                                    text={item}
                                    onCopy={() => {
                                        toastSuccess('Copied to clipboard!');
                                    }}
                                >
                                    <IconButton size="small">
                                        <ContentCopyRoundedIcon fontSize="small" />
                                    </IconButton>
                                </CopyToClipboard>
                                <Link underline="none" target="_blank" href={getBscScanLink(item, 'address')}>
                                    <IconButton size="small">
                                        <TravelExploreRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Link>
                            </Stack>
                            {(() => {
                                if (!status.startTime || !status.endTime)
                                    return (
                                        <Skeleton
                                            sx={{
                                                minWidth: (theme) => theme.spacing(10)
                                            }}
                                            animation="wave"
                                        />
                                    );
                                const cTime = Math.floor(new Date().getTime() / 1000);
                                const isStarted = status.startTime < cTime;
                                if (isStarted) {
                                    const isEnded = status.endTime < cTime;
                                    if (isEnded) {
                                        return (
                                            <Chip
                                                size="small"
                                                variant="filled"
                                                color="success"
                                                icon={
                                                    status.publicMode ? (
                                                        <CircleRoundedIcon sx={{ fontSize: '12px !important' }} />
                                                    ) : (
                                                        <LockRoundedIcon sx={{ fontSize: '14px !important' }} />
                                                    )
                                                }
                                                label="Sale Ended"
                                                sx={{
                                                    bgcolor: 'rgb(80 0 0)',
                                                    boxShadow: 'none',
                                                    backgroundImage: 'none',
                                                    borderRadius: 1,
                                                    color: 'red'
                                                }}
                                            />
                                        );
                                    }
                                    return (
                                        <Chip
                                            size="small"
                                            variant="filled"
                                            color="success"
                                            icon={
                                                status.publicMode ? (
                                                    <CircleRoundedIcon sx={{ fontSize: '12px !important' }} />
                                                ) : (
                                                    <LockRoundedIcon sx={{ fontSize: '14px !important' }} />
                                                )
                                            }
                                            label="Sale Live"
                                            sx={{
                                                bgcolor: 'rgb(0 80 0)',
                                                boxShadow: 'none',
                                                backgroundImage: 'none',
                                                borderRadius: 1,
                                                color: '#07db07'
                                            }}
                                        />
                                    );
                                } else {
                                    return (
                                        <Chip
                                            size="small"
                                            variant="filled"
                                            color="success"
                                            icon={
                                                status.publicMode ? (
                                                    <CircleRoundedIcon sx={{ fontSize: '12px !important' }} />
                                                ) : (
                                                    <LockRoundedIcon sx={{ fontSize: '14px !important' }} />
                                                )
                                            }
                                            label="Upcoming"
                                            sx={{
                                                bgcolor: 'rgb(80 80 0)',
                                                boxShadow: 'none',
                                                backgroundImage: 'none',
                                                borderRadius: 1,
                                                color: 'yellow'
                                            }}
                                        />
                                    );
                                }
                            })()}
                        </Stack>
                    </Stack>
                    <Stack spacing={2}>
                        <Stack>
                            <Typography variant="h5">
                                {(() => {
                                    if (!token.name) {
                                        return (
                                            <Skeleton
                                                sx={{
                                                    minWidth: (theme) => theme.spacing(10)
                                                }}
                                                animation="wave"
                                            />
                                        );
                                    }
                                    return token.name;
                                })()}
                            </Typography>
                            <Typography variant="subtitle2" color="textSecondary" justifySelf="flex-start">
                                {(() => {
                                    if (!status.price || !token.decimals) {
                                        return (
                                            <Skeleton
                                                sx={{
                                                    minWidth: (theme) => theme.spacing(10)
                                                }}
                                                animation="wave"
                                            />
                                        );
                                    }
                                    return `1 BNB = ${formatNumber(fromWei(status.price, token.decimals))}`;
                                })()}
                            </Typography>
                        </Stack>
                        <Stack>
                            <Typography>Soft/Hard</Typography>
                            <Typography variant="h6" color="primary">
                                {(() => {
                                    if (!status.softcap || !status.hardcap) {
                                        return (
                                            <Skeleton
                                                sx={{
                                                    minWidth: (theme) => theme.spacing(10)
                                                }}
                                                animation="wave"
                                            />
                                        );
                                    }
                                    return `${formatNumber(fromWei(status.softcap))} BNB - ${formatNumber(
                                        fromWei(status.hardcap)
                                    )} BNB`;
                                })()}
                            </Typography>
                        </Stack>
                        <Stack>
                            <Stack>
                                <Typography color="textSecondary">
                                    {(() => {
                                        if (!status.softcap || !status.hardcap) {
                                            return (
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            );
                                        }
                                        return `Progress ( ${(
                                            (fromWei(ethersToBigNumber(status.raised)) / fromWei(status.hardcap)) *
                                            100
                                        ).toFixed(2)}% )`;
                                    })()}
                                </Typography>
                            </Stack>
                            <LinearProgress
                                variant="determinate"
                                value={(() => {
                                    if (!status.raised || !status.hardcap) return 0;
                                    return (fromWei(ethersToBigNumber(status.raised)) / fromWei(status.hardcap)) * 100;
                                })()}
                                sx={{ mt: 0.5, mb: 0.25, height: 6, borderRadius: 1 }}
                            />
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="caption" color="textSecondary">
                                    {(() => {
                                        if (!status.softcap) {
                                            return (
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            );
                                        }
                                        return `${formatNumber(fromWei(status.softcap))} BNB`;
                                    })()}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
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
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" pt={2}>
                            {(() => {
                                if (!status.startTime || !status.endTime)
                                    return (
                                        <Skeleton
                                            sx={{
                                                minWidth: (theme) => theme.spacing(10)
                                            }}
                                            animation="wave"
                                        />
                                    );
                                const cTime = Math.floor(new Date().getTime() / 1000);
                                const isStarted = status.startTime < cTime;
                                if (isStarted) {
                                    const isEnded = status.endTime < cTime;
                                    if (isEnded) {
                                        return (
                                            <Stack>
                                                <Typography variant="caption">Sale Ended In</Typography>
                                                <Typography variant="caption">
                                                    {new Date(status.endTime * 1000).toLocaleString('en-US', {
                                                        month: 'long',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        second: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                </Typography>
                                            </Stack>
                                        );
                                    }
                                    return (
                                        <Stack>
                                            <Typography variant="caption">Sale Ends in:</Typography>
                                            <Timer update={update} endTime={status.endTime} />
                                        </Stack>
                                    );
                                } else {
                                    return (
                                        <Stack>
                                            <Typography variant="caption">Sale Starts in:</Typography>
                                            <Timer update={update} endTime={status.startTime} />
                                        </Stack>
                                    );
                                }
                            })()}
                            {(() => {
                                if (status.tokenOwner === account) {
                                    return (
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            sx={{
                                                bgcolor: 'primary.dark'
                                            }}
                                            onClick={() => {
                                                navigate(`/launchpad/manage/${item}`);
                                            }}
                                        >
                                            Manage Pool
                                        </Button>
                                    );
                                }
                                return (
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={() => {
                                            navigate(`/launchpad/view/${item}`);
                                        }}
                                    >
                                        View Pool
                                    </Button>
                                );
                            })()}
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Grid>
    );
};

export default PresaleItem;
