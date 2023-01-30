import { useState, useEffect } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import LoadingButton from '@mui/lab/LoadingButton';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

// ** Material UI Icons ** //
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import CountDown from 'components/Time/CountDown';
import TrueTable from 'components/TrueTable';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ToastDescriptionWithTx } from 'components/Toast';

import { multicallv2 } from 'utils/multicall';

import { useParams } from 'react-router-dom';
import { useLaunchpadContract, usePoolContract } from 'hooks/useContract';
import useToast from 'hooks/useToast';
import useCatchTxError from 'hooks/useCatchTxError';
import useActiveWeb3React from 'hooks/useActiveWeb3React';

import poolAbi from 'config/abi/pool.json';

import { BigNumber as EthersBigNumber } from '@ethersproject/bignumber';
import { ethersToBigNumber, formatNumber, fromWei, toWei } from 'utils/bigNumber';
import { getBscScanLink } from 'utils';

const Manage = () => {
    const { address } = useParams();
    const { account, active } = useActiveWeb3React();

    const [activeTab, setActiveTab] = useState<string>('created');

    const [status, setStatus] = useState<any>({});
    const [token, setToken] = useState<any>({});

    const [amount, setAmount] = useState<any>({
        bnb: '',
        token: ''
    });

    const { toastSuccess } = useToast();
    const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError();

    const [presale, setPresale] = useState<any>({
        hardcap: 10000,
        softcap: 0,
        max: 100,
        min: 0,
        start: new Date(new Date().getTime() + 1 * 60 * 60 * 1000),
        end: new Date(new Date().getTime() + 25 * 60 * 60 * 1000),
        isPublic: false
    });

    const handleActiveTabChange = (event: React.SyntheticEvent, newTab: string) => {
        setActiveTab(newTab);
    };
    const handleChange = (newValue: Date | null, name: string) => {
        setPresale((prevState: any) => ({
            ...prevState,
            [name]: newValue
        }));
    };
    const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAmount((prevState: any) => ({
            ...prevState,
            [event.target.name]: event.target.value
        }));
    };
    const handlePresaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPresale((prevState: any) => ({
            ...prevState,
            [event.target.name]: event.target.value
        }));
    };

    const enableSale = async () => {
        const receipt = await fetchWithCatchTxError(() => {
            return preSaleContract.enableSale();
        });
        if (receipt?.status) {
            updateAll();
            toastSuccess(
                'Ended',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>You Ended Presale!</ToastDescriptionWithTx>
            );
        }
    };
    const cancelSale = async () => {
        const receipt = await fetchWithCatchTxError(() => {
            return preSaleContract.cancelSale();
        });
        if (receipt?.status) {
            updateAll();
            toastSuccess(
                'Ended',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>You Ended Presale!</ToastDescriptionWithTx>
            );
        }
    };
    const endSale = async () => {
        const receipt = await fetchWithCatchTxError(() => {
            return preSaleContract.endSale();
        });
        if (receipt?.status) {
            updateAll();
            toastSuccess(
                'Ended',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>You Ended Presale!</ToastDescriptionWithTx>
            );
        }
    };
    const enableClaim = async () => {
        const receipt = await fetchWithCatchTxError(() => {
            return preSaleContract.enableClaim();
        });
        if (receipt?.status) {
            updateAll();
            toastSuccess(
                'Claim Enabled',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    Your Presale is enabled for claim.
                </ToastDescriptionWithTx>
            );
        }
    };
    const multiSend = async () => {
        const receipt = await fetchWithCatchTxError(() => {
            return preSaleContract.multiSend();
        });
        if (receipt?.status) {
            updateAll();
            toastSuccess(
                'Multi Send',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    Multi Send is available for now.
                </ToastDescriptionWithTx>
            );
        }
    };
    const updatePublicMode = async () => {
        const receipt = await fetchWithCatchTxError(() => {
            return preSaleContract.setPublicMode(presale.isPublic);
        });
        if (receipt?.status) {
            updateAll();
            toastSuccess(
                'Updated Public Mode.',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    Your pool has been updated.
                </ToastDescriptionWithTx>
            );
        }
    };
    const updateInvestable = async () => {
        const receipt = await fetchWithCatchTxError(() => {
            return preSaleContract.setInvestable(toWei(presale.min).toString(), toWei(presale.max).toString());
        });
        if (receipt?.status) {
            updateAll();
            toastSuccess(
                'Updated Investable.',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    Your pool has been updated.
                </ToastDescriptionWithTx>
            );
        }
    };
    const updateCaps = async () => {
        const receipt = await fetchWithCatchTxError(() => {
            return preSaleContract.setCap(toWei(presale.softcap).toString(), toWei(presale.hardcap).toString());
        });
        if (receipt?.status) {
            updateAll();
            toastSuccess(
                'Updated Caps.',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    Your pool has been updated.
                </ToastDescriptionWithTx>
            );
        }
    };
    const updateStartTime = async () => {
        const receipt = await fetchWithCatchTxError(() => {
            return preSaleContract.updateStartTime(presale.startTime);
        });
        if (receipt?.status) {
            updateAll();
            toastSuccess(
                'Updated Start Time.',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    Your pool has been updated.
                </ToastDescriptionWithTx>
            );
        }
    };
    const updateEndTime = async () => {
        const receipt = await fetchWithCatchTxError(() => {
            return preSaleContract.updateEndTime(presale.startTime);
        });
        if (receipt?.status) {
            updateAll();
            toastSuccess(
                'Updated End Time.',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    Your pool has been updated.
                </ToastDescriptionWithTx>
            );
        }
    };
    const updatePrice = async () => {
        const receipt = await fetchWithCatchTxError(() => {
            return preSaleContract.updatePrice(presale.price);
        });
        if (receipt?.status) {
            updateAll();
            toastSuccess(
                'Updated Price.',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    Your pool has been updated.
                </ToastDescriptionWithTx>
            );
        }
    };
    const finalize = async () => {
        const receipt = await fetchWithCatchTxError(() => {
            return preSaleContract.finalize(amount.bnb.toString(), amount.token.toString());
        });
        if (receipt?.status) {
            updateAll();
            toastSuccess(
                'Finalized',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    You just finalized your Presale!
                </ToastDescriptionWithTx>
            );
        }
    };

    const preSaleContract = usePoolContract(address);
    const launchpadContract = useLaunchpadContract();

    const update = async () => {
        try {
            const methods = [
                'token',
                'raised',
                'price',
                'endTime',
                'minInvestable',
                'maxInvestable',
                'hardcap',
                'ended',
                'enabled',
                'claimEnabled',
                'startTime',
                'timestamp',
                'startedSale',
                'count',
                'fee',
                'saleAmount',
                'unclaimed'
            ];
            const calls = methods.map((method) => ({
                address: preSaleContract.address,
                name: method
            }));
            const psaleResult = await multicallv2(poolAbi, calls);
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
            }
        } catch (e: any) {
            console.log(e);
        }
    };
    const updatePoolMap = () => {
        launchpadContract.poolMap(address).then((result: any) => {
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

    // ** Effect ** //
    useEffect(() => {
        const interval = setInterval(() => {
            update();
        }, 12000);
        update();
        return () => clearInterval(interval);
    }, [account, active]);
    useEffect(() => {
        if (!address) return;
        updatePoolMap();
    }, []);
    useEffect(() => {
        if (!status.token) return;
        updateToken();
    }, [status.token]);

    const updateAll = () => {
        update();
        updateToken();
        updatePoolMap();
    };

    const startTimeComp = (
        <TableRow>
            <TableCell>Start Time:</TableCell>
            <TableCell>
                {(() => {
                    if (!status.startTime)
                        return (
                            <Skeleton
                                sx={{
                                    minWidth: (theme) => theme.spacing(10)
                                }}
                                animation="wave"
                            />
                        );
                    return new Date(status.startTime * 1000).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        second: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                })()}
            </TableCell>
        </TableRow>
    );

    const endTimeComp = (
        <TableRow>
            <TableCell>End Time:</TableCell>
            <TableCell>
                {(() => {
                    if (!status.endTime)
                        return (
                            <Skeleton
                                sx={{
                                    minWidth: (theme) => theme.spacing(10)
                                }}
                                animation="wave"
                            />
                        );
                    return new Date(status.endTime * 1000).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        second: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                })()}
            </TableCell>
        </TableRow>
    );

    const raisedComp = (
        <TableRow>
            <TableCell>Raised:</TableCell>
            <TableCell>
                {(() => {
                    if (!status.raised) {
                        return (
                            <Skeleton
                                sx={{
                                    minWidth: (theme) => theme.spacing(10)
                                }}
                                animation="wave"
                            />
                        );
                    }
                    return `${formatNumber(fromWei(status.raised))} BNB`;
                })()}
            </TableCell>
        </TableRow>
    );

    const investorsComp = (
        <TableRow>
            <TableCell>Investors:</TableCell>
            <TableCell>
                {(() => {
                    if (!status.count) {
                        return (
                            <Skeleton
                                sx={{
                                    minWidth: (theme) => theme.spacing(10)
                                }}
                                animation="wave"
                            />
                        );
                    }
                    return `${formatNumber(status.count)}`;
                })()}
            </TableCell>
        </TableRow>
    );

    const soldComp = (
        <TableRow>
            <TableCell>Sold:</TableCell>
            <TableCell>
                {(() => {
                    if (!status.saleAmount) {
                        return (
                            <Skeleton
                                sx={{
                                    minWidth: (theme) => theme.spacing(10)
                                }}
                                animation="wave"
                            />
                        );
                    }
                    return `${formatNumber(fromWei(status.saleAmount))} BNB`;
                })()}
            </TableCell>
        </TableRow>
    );
    const liquidityInputComp = (
        <TableRow>
            <TableCell colSpan={2}>
                <Stack spacing={2}>
                    <Stack spacing={1}>
                        <Typography variant="caption">BNB Amount for Liquidity:</Typography>
                        <TextField
                            variant="filled"
                            size="small"
                            name="bnb"
                            value={amount.bnb}
                            onChange={handleAmountChange}
                            type="number"
                        />
                    </Stack>
                    <Stack spacing={1}>
                        <Typography variant="caption">Token Amount for Liquidity:</Typography>
                        <TextField
                            variant="filled"
                            size="small"
                            name="token"
                            value={amount.token}
                            onChange={handleAmountChange}
                            type="number"
                        />
                    </Stack>
                </Stack>
            </TableCell>
        </TableRow>
    );
    const endedActionsComp = (
        <TableRow>
            <TableCell colSpan={2}>
                <Stack direction="row" spacing={2}>
                    <LoadingButton
                        fullWidth
                        variant="contained"
                        color="secondary"
                        loading={pendingTx}
                        onClick={finalize}
                        disabled={!account}
                    >
                        Finalize
                    </LoadingButton>
                </Stack>
            </TableCell>
        </TableRow>
    );

    const amountComp = (
        <TableRow>
            <TableCell>Amount:</TableCell>
            <TableCell sx={{ width: '50%' }}>
                {(() => {
                    if (!status.fee) {
                        return (
                            <Skeleton
                                sx={{
                                    minWidth: (theme) => theme.spacing(10)
                                }}
                                animation="wave"
                            />
                        );
                    }
                    return `0`;
                })()}
            </TableCell>
        </TableRow>
    );

    const serviceFeeComp = (
        <TableRow>
            <TableCell>Service Fee:</TableCell>
            <TableCell sx={{ width: '50%' }}>
                {(() => {
                    if (!status.fee) {
                        return (
                            <Skeleton
                                sx={{
                                    minWidth: (theme) => theme.spacing(10)
                                }}
                                animation="wave"
                            />
                        );
                    }
                    return `${formatNumber(status.fee)}%`;
                })()}
            </TableCell>
        </TableRow>
    );

    const finalizedActionsComp = (
        <TableRow>
            <TableCell colSpan={2}>
                <Stack direction="row" spacing={2}>
                    <LoadingButton
                        fullWidth
                        variant="contained"
                        color="secondary"
                        onClick={enableClaim}
                        loading={pendingTx}
                        disabled={!account}
                    >
                        Enable Claim
                    </LoadingButton>
                    <LoadingButton
                        fullWidth
                        variant="contained"
                        color="secondary"
                        onClick={multiSend}
                        loading={pendingTx}
                        disabled={!account}
                        sx={{
                            bgcolor: 'primary.dark'
                        }}
                    >
                        Multi Send
                    </LoadingButton>
                </Stack>
            </TableCell>
        </TableRow>
    );

    const claimedComp = (
        <TableRow>
            <TableCell>Claimed:</TableCell>
            <TableCell>
                {(() => {
                    if (!status.saleAmount || !status.unclaimed) {
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
                        fromWei(ethersToBigNumber(status.saleAmount).minus(ethersToBigNumber(status.unclaimed)))
                    )} BNB`;
                })()}
            </TableCell>
        </TableRow>
    );

    const claimActionsComp = (
        <TableRow>
            <TableCell colSpan={2}>
                <Stack direction="row" spacing={2}>
                    <LoadingButton
                        fullWidth
                        variant="contained"
                        color="secondary"
                        onClick={multiSend}
                        loading={pendingTx}
                        disabled={!account}
                        sx={{
                            bgcolor: 'primary.dark'
                        }}
                    >
                        Multi Send
                    </LoadingButton>
                </Stack>
            </TableCell>
        </TableRow>
    );

    const startedActionsComp = (
        <TableRow>
            <TableCell colSpan={2}>
                <LoadingButton
                    color="error"
                    fullWidth
                    loading={pendingTx}
                    onClick={endSale}
                    disabled={!account}
                    sx={{
                        minWidth: (theme) => theme.spacing(20),
                        alignSelf: 'center'
                    }}
                    variant="contained"
                >
                    End Sale
                </LoadingButton>
            </TableCell>
        </TableRow>
    );

    const progressComp = (
        <TableRow>
            <TableCell colSpan={2}>
                <Stack direction="row" alignItems="center" justifyContent="center">
                    {(() => {
                        const percent = (status.raised / status.hardcap) * 100;
                        return (
                            <LinearProgress
                                variant="determinate"
                                value={percent || 0}
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
                    {(() => {
                        if (status.raised && status.hardcap) {
                            return (
                                <Typography
                                    sx={{
                                        position: 'absolute'
                                    }}
                                >
                                    {fromWei(status.raised)} BNB / {fromWei(status.hardcap)} BNB
                                </Typography>
                            );
                        }
                    })()}
                </Stack>
            </TableCell>
        </TableRow>
    );

    const endTimerComp = (
        <TableRow>
            <TableCell colSpan={2}>
                <Stack spacing={1.5} alignItems="center">
                    <Typography>Sale Ends In</Typography>
                    <CountDown
                        callback={update}
                        spacing={2}
                        units={{
                            isDay: true,
                            isHour: true,
                            isMinute: true,
                            isSecond: true
                        }}
                        endTime={status.endTime}
                        size={48}
                    />
                </Stack>
            </TableCell>
        </TableRow>
    );

    const createdComp = (
        <>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>PublicMode</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack>
                        <Stack spacing={1.5}>
                            <Typography variant="caption">- setPublicMode(bool)</Typography>
                            <TextField
                                variant="filled"
                                name="isPublic"
                                size="small"
                                select
                                value={presale.isPublic ?? false}
                                onChange={handlePresaleChange}
                                SelectProps={{
                                    native: true
                                }}
                            >
                                <option value={true as any}>True</option>
                                <option value={false as any}>False</option>
                            </TextField>
                            <LoadingButton
                                variant="contained"
                                color="secondary"
                                size="small"
                                loading={pendingTx}
                                disabled={!account}
                                onClick={updatePublicMode}
                                sx={{ alignSelf: 'flex-start' }}
                            >
                                Update
                            </LoadingButton>
                        </Stack>
                    </Stack>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Whitelist</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack spacing={1.5}>
                        <Typography variant="caption">- setWhitelist(address[])</Typography>
                        <TextField
                            variant="filled"
                            name="hardcap"
                            size="small"
                            value={presale.isPublic ?? false}
                            onChange={handlePresaleChange}
                            type="number"
                        >
                            <option value="true">True</option>
                            <option value="false">False</option>
                        </TextField>
                        <LoadingButton
                            variant="contained"
                            color="secondary"
                            size="small"
                            loading={pendingTx}
                            disabled={!account}
                            onClick={updatePublicMode}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            Update
                        </LoadingButton>
                    </Stack>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Investable</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack>
                        <Stack spacing={1}>
                            <Typography variant="caption">- setInvestable(min, max)</Typography>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    variant="filled"
                                    name="min"
                                    size="small"
                                    value={presale.min ?? ''}
                                    onChange={handlePresaleChange}
                                    type="number"
                                    fullWidth
                                    inputProps={{
                                        placeholder: 'Min'
                                    }}
                                />
                                <TextField
                                    variant="filled"
                                    name="max"
                                    size="small"
                                    value={presale.max ?? ''}
                                    onChange={handlePresaleChange}
                                    type="number"
                                    fullWidth
                                    inputProps={{
                                        placeholder: 'Max'
                                    }}
                                />
                            </Stack>
                            <LoadingButton
                                variant="contained"
                                color="secondary"
                                size="small"
                                loading={pendingTx}
                                disabled={!account}
                                onClick={updateInvestable}
                                sx={{ alignSelf: 'flex-start' }}
                            >
                                Update
                            </LoadingButton>
                        </Stack>
                    </Stack>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Caps</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack>
                        <Stack spacing={1}>
                            <Typography variant="caption">- setCap(soft, hard)</Typography>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    variant="filled"
                                    name="softcap"
                                    size="small"
                                    value={presale.softcap ?? ''}
                                    onChange={handlePresaleChange}
                                    type="number"
                                    fullWidth
                                    inputProps={{
                                        placeholder: 'Soft Cap'
                                    }}
                                />
                                <TextField
                                    variant="filled"
                                    name="hardcap"
                                    size="small"
                                    value={presale.hardcap ?? ''}
                                    onChange={handlePresaleChange}
                                    type="number"
                                    fullWidth
                                    inputProps={{
                                        placeholder: 'Hard Cap'
                                    }}
                                />
                            </Stack>
                            <LoadingButton
                                variant="contained"
                                color="secondary"
                                size="small"
                                onClick={updateCaps}
                                loading={pendingTx}
                                disabled={!account}
                                sx={{ alignSelf: 'flex-start' }}
                            >
                                Update
                            </LoadingButton>
                        </Stack>
                    </Stack>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Start Time</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack spacing={1.5}>
                        <Typography variant="caption">- updateStartTime(uint)</Typography>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateTimePicker
                                value={presale.start ?? new Date()}
                                onChange={(value: any) => handleChange(value, 'start')}
                                renderInput={(params) => {
                                    params.inputProps.value = presale.start
                                        ? presale.start.toLocaleString('en-US', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: '2-digit',
                                              hour: '2-digit',
                                              second: '2-digit',
                                              minute: '2-digit',
                                              hour12: true
                                          })
                                        : ' ';
                                    return <TextField variant="filled" size="small" {...params} />;
                                }}
                            />
                        </LocalizationProvider>
                        <LoadingButton
                            variant="contained"
                            color="secondary"
                            size="small"
                            onClick={updateStartTime}
                            loading={pendingTx}
                            disabled={!account}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            Update
                        </LoadingButton>
                    </Stack>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>End Time</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack spacing={1.5}>
                        <Typography variant="caption">- updateEndTime(uint)</Typography>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateTimePicker
                                value={presale.end ?? new Date()}
                                onChange={(value: any) => handleChange(value, 'end')}
                                renderInput={(params) => {
                                    params.inputProps.value = presale.end
                                        ? presale.end.toLocaleString('en-US', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: '2-digit',
                                              hour: '2-digit',
                                              second: '2-digit',
                                              minute: '2-digit',
                                              hour12: true
                                          })
                                        : ' ';
                                    return <TextField variant="filled" size="small" {...params} />;
                                }}
                            />
                        </LocalizationProvider>
                        <LoadingButton
                            variant="contained"
                            color="secondary"
                            size="small"
                            onClick={updateEndTime}
                            loading={pendingTx}
                            disabled={!account}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            Update
                        </LoadingButton>
                    </Stack>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Price</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack spacing={1.5}>
                        <Typography variant="caption">- setPrice(uint)</Typography>
                        <TextField
                            variant="filled"
                            name="price"
                            size="small"
                            value={presale.price ?? ''}
                            onChange={handlePresaleChange}
                            type="number"
                        />
                        <LoadingButton
                            variant="contained"
                            color="secondary"
                            size="small"
                            loading={pendingTx}
                            disabled={!account}
                            onClick={updatePrice}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            Update
                        </LoadingButton>
                    </Stack>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Actions</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack spacing={1.5} direction="row">
                        <LoadingButton
                            variant="contained"
                            color="error"
                            size="small"
                            loading={pendingTx}
                            disabled={!account}
                            onClick={cancelSale}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            Cancel
                        </LoadingButton>
                        <LoadingButton
                            variant="contained"
                            color="success"
                            size="small"
                            loading={pendingTx}
                            disabled={!account}
                            onClick={enableSale}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            Enable Sale
                        </LoadingButton>
                    </Stack>
                </AccordionDetails>
            </Accordion>
        </>
    );

    return (
        <Container
            maxWidth="md"
            sx={{
                pt: 2,
                pb: 2,
                zIndex: 1000,
                position: 'relative',
                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                    margin: 0,
                    WebkitAppearance: 'none'
                },
                '& input[type=number]': {
                    MozAppearance: 'textfield'
                }
            }}
        >
            <Card variant="outlined">
                <Grid container>
                    <Grid item xs={12}>
                        <CardContent sx={{ padding: 3, borderBottom: 1, borderColor: 'divider' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Stack direction="row" spacing={2}>
                                    <Avatar
                                        src={
                                            status.logo && status.logo !== ''
                                                ? status.logo
                                                : require('assets/img/tefi.png')
                                        }
                                        alt="Tefi"
                                        sx={{ width: 64, height: 64 }}
                                    />
                                    <Stack justifyContent="center">
                                        <Typography variant="h6" lineHeight={'28px'}>
                                            {token.symbol} Presale
                                        </Typography>
                                        <Typography color="textSecondary" lineHeight={'18px'}>
                                            {token.name}
                                        </Typography>
                                    </Stack>
                                </Stack>
                                <Stack spacing={1} direction="row" alignItems="center">
                                    <Stack direction="row" alignItems="center" spacing={0} justifyContent="flex-end">
                                        <CopyToClipboard text={address}>
                                            <IconButton size="small">
                                                <ContentCopyRoundedIcon fontSize="small" />
                                            </IconButton>
                                        </CopyToClipboard>
                                        <Link
                                            underline="none"
                                            target="_blank"
                                            href={getBscScanLink(address, 'address')}
                                        >
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
                                                                <CircleRoundedIcon
                                                                    sx={{ fontSize: '12px !important' }}
                                                                />
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
                        </CardContent>
                    </Grid>
                    <Grid item xs={12}>
                        <Tabs
                            variant="fullWidth"
                            value={activeTab}
                            indicatorColor="secondary"
                            textColor="inherit"
                            onChange={handleActiveTabChange}
                            aria-label="Vertical tabs example"
                            sx={{
                                borderBottom: 1,
                                borderColor: 'divider',
                                '& .MuiTabs-flexContainer': {
                                    gap: '8px'
                                },
                                '& .MuiTab-root': {
                                    minWidth: 100,
                                    '&.Mui-selected': {
                                        bgcolor: 'secondary.main'
                                    }
                                }
                            }}
                        >
                            <Tab value="created" label="Created" />
                            <Tab value="started" label="Started" />
                            <Tab value="ended" label="Ended" />
                            <Tab value="finalized" label="Finalized" />
                            <Tab value="enabled-claim" label="Enabled Claim" />
                        </Tabs>
                    </Grid>
                    <Grid item xs={12}>
                        <CardContent sx={{ padding: 4 }}>
                            {(() => {
                                switch (activeTab) {
                                    case 'created': {
                                        return createdComp;
                                    }
                                    case 'started': {
                                        return (
                                            <Container maxWidth="xs">
                                                <Card variant="outlined">
                                                    <TrueTable>
                                                        <TableBody>
                                                            {endTimerComp}
                                                            {progressComp}
                                                            {investorsComp}
                                                            {startedActionsComp}
                                                        </TableBody>
                                                    </TrueTable>
                                                </Card>
                                            </Container>
                                        );
                                    }
                                    case 'ended': {
                                        return (
                                            <Container maxWidth="xs">
                                                <Card variant="outlined">
                                                    <TrueTable>
                                                        <TableBody>
                                                            {startTimeComp}
                                                            {endTimeComp}
                                                            {raisedComp}
                                                            {serviceFeeComp}
                                                            {amountComp}
                                                            {liquidityInputComp}
                                                            {endedActionsComp}
                                                        </TableBody>
                                                    </TrueTable>
                                                </Card>
                                            </Container>
                                        );
                                    }
                                    case 'finalized': {
                                        return (
                                            <Container maxWidth="xs">
                                                <Card variant="outlined">
                                                    <TrueTable>
                                                        <TableBody>
                                                            {startTimeComp}
                                                            {endTimeComp}
                                                            {raisedComp}
                                                            {investorsComp}
                                                            {soldComp}
                                                            {finalizedActionsComp}
                                                        </TableBody>
                                                    </TrueTable>
                                                </Card>
                                            </Container>
                                        );
                                    }
                                    case 'enabled-claim': {
                                        return (
                                            <Container maxWidth="xs">
                                                <Card variant="outlined">
                                                    <TrueTable>
                                                        <TableBody>
                                                            {startTimeComp}
                                                            {endTimeComp}
                                                            {raisedComp}
                                                            {investorsComp}
                                                            {soldComp}
                                                            {claimedComp}
                                                            {claimActionsComp}
                                                        </TableBody>
                                                    </TrueTable>
                                                </Card>
                                            </Container>
                                        );
                                    }
                                }
                            })()}
                        </CardContent>
                    </Grid>
                </Grid>
            </Card>
        </Container>
    );
};

export default Manage;
