import { ChangeEvent, useCallback, useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

import LoadingButton from '@mui/lab/LoadingButton';

import CountDown from 'components/Time/CountDown';
import { ToastDescriptionWithTx } from 'components/Toast';

import tokens from 'config/constants/tokens';

import useAuth from 'hooks/useAuth';
import useToast from 'hooks/useToast';
import useCatchTxError from 'hooks/useCatchTxError';
import useActiveWeb3React from 'hooks/useActiveWeb3React';
import { useWalletModal } from 'components/WalletModal';
import { useLotteryContract, useMainTokenContract } from 'hooks/useContract';

import LoyaltyIcon from '@mui/icons-material/Loyalty';

import { ethersToBigNumber, formatNumber, fromWei, toBigNumber, toWei } from 'utils/bigNumber';
import multicall from 'utils/multicall';
import { ethers } from 'ethers';

const Lottery = () => {
    const [status, setStatus] = useState<any>({});
    const [open, setOpen] = useState<boolean>(false);
    const [balance, setBalance] = useState<any>();
    const [isApproved, setIsApproved] = useState<boolean>(false);
    const [amount, setAmount] = useState<any>('');

    const { login, logout } = useAuth();
    const { onPresentConnectModal } = useWalletModal(login, logout);
    const { account } = useActiveWeb3React();

    const { toastSuccess } = useToast();
    const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError();

    const tokenContract = useMainTokenContract();
    const lotteryContract = useLotteryContract();

    const handleClose = () => {
        setOpen(false);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setAmount(event.target.value);
    };
    const resetAmount = () => {
        setAmount('');
    };

    const buyTicket = async () => {
        const am = amount * status.priceOfTicket;
        const receipt = await fetchWithCatchTxError(() => {
            return lotteryContract.participate(Number(am));
        });
        if (receipt?.status) {
            update();
            resetAmount();
            setOpen(false);
            toastSuccess(
                'Bought',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    {`You have bought Tickets!`}
                </ToastDescriptionWithTx>
            );
        }
    };

    const approve = async () => {
        const spender = lotteryContract.address;
        const receipt = await fetchWithCatchTxError(() => {
            return tokenContract.approve(spender, ethers.constants.MaxUint256);
        });
        if (receipt?.status) {
            setIsApproved(true);
            toastSuccess(
                'Approved',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    {`You can now buy tickets with your TEFI!`}
                </ToastDescriptionWithTx>
            );
        }
    };

    const update = useCallback(async () => {
        const methods = [
            'jackpotBalance',
            'jackpotIsOpen',
            'canParticipateUntil',
            'jackpotTotalPrizeInJackpotToken',
            'priceOfTicket'
        ];
        const calls = methods.map((method) => ({
            address: lotteryContract.address,
            name: method
        }));
        const psaleResult = await multicall(require('config/abi/lottery.json'), calls);
        psaleResult.forEach((value: any, idx: number) => {
            setStatus((prevState) => ({
                ...prevState,
                [methods[idx]]: typeof value[0] === 'boolean' ? value[0] : ethersToBigNumber(value[0])
            }));
        });
        if (!account) return;
        lotteryContract.getTicketsBought(account).then((result: any) => {
            setStatus((prevState) => ({
                ...prevState,
                tickets: result
            }));
        });
        tokenContract.balanceOf(account).then(setBalance);
    }, [account]);

    useEffect(() => {
        if (!account || !status.priceOfTicket) return;
        tokenContract.allowance(account, lotteryContract.address).then((result: any) => {
            const allowance = ethersToBigNumber(result);
            const am = toWei(amount * status.priceOfTicket, tokens.tefi.decimals);
            if (allowance.isGreaterThanOrEqualTo(am)) {
                setIsApproved(true);
            } else {
                setIsApproved(false);
            }
        });
    }, [amount, status.priceOfTicket]);

    useEffect(() => {
        update();
    }, [update]);

    return (
        <Container>
            <Card
                variant="outlined"
                sx={{
                    width: '100%',
                    height: '100%',
                    mt: 4,
                    position: 'relative',
                    margin: 'auto',
                    boxShadow: '6px 2px 12px 0px rgba(0, 0, 0, 0.1)',
                    maxWidth: (theme) => theme.spacing(52),
                    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                        margin: 0,
                        WebkitAppearance: 'none'
                    },
                    '& input[type=number]': {
                        MozAppearance: 'textfield'
                    }
                }}
            >
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
                            <TableCell colSpan={2}>
                                <Stack alignItems="center" justifyContent="center" spacing={3} pt={2} pb={1}>
                                    <Typography>Participate until</Typography>
                                    <CountDown
                                        endTime={status.canParticipateUntil}
                                        size={48}
                                        units={{
                                            isDay: true,
                                            isHour: true,
                                            isMinute: true,
                                            isSecond: true
                                        }}
                                    />
                                    <Typography width="100%" sx={{ textAlign: 'center' }}>
                                        {(() => {
                                            if (!status.canParticipateUntil) {
                                                return (
                                                    <Skeleton
                                                        animation="wave"
                                                        sx={{ width: '100%', maxWidth: 120, margin: 'auto' }}
                                                    />
                                                );
                                            }
                                            return new Date(status.canParticipateUntil * 1000).toLocaleString('en-US', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                second: '2-digit',
                                                minute: '2-digit',
                                                hour12: false
                                            });
                                        })()}
                                    </Typography>
                                </Stack>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Typography>Jackpot Balance:</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography textAlign="right">
                                    {(() => {
                                        if (!status.jackpotBalance) {
                                            return <Skeleton variant="text" animation="wave" width="100%" />;
                                        }
                                        return `${formatNumber(
                                            fromWei(status.jackpotBalance, tokens.tefi.decimals)
                                        )} TEFI`;
                                    })()}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Typography>Total Prize:</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography textAlign="right">
                                    {(() => {
                                        if (!status.jackpotTotalPrizeInJackpotToken) {
                                            return <Skeleton variant="text" animation="wave" width="100%" />;
                                        }
                                        return `${formatNumber(
                                            fromWei(status.jackpotTotalPrizeInJackpotToken, tokens.busd.decimals)
                                        )} BUSD`;
                                    })()}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Typography>Ticket Price:</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography textAlign="right">
                                    {(() => {
                                        if (!status.priceOfTicket) {
                                            return <Skeleton variant="text" animation="wave" width="100%" />;
                                        }
                                        return `${formatNumber(status.priceOfTicket)} TEFI`;
                                    })()}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Typography>Your Tickets:</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography textAlign="right">
                                    {(() => {
                                        if (!status.tickets) {
                                            return <Skeleton variant="text" animation="wave" width="100%" />;
                                        }
                                        return `${formatNumber(status.tickets)}`;
                                    })()}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={2}>
                                {(() => {
                                    if (!account) {
                                        return (
                                            <LoadingButton
                                                onClick={onPresentConnectModal}
                                                variant="contained"
                                                fullWidth
                                            >
                                                Connect Wallet
                                            </LoadingButton>
                                        );
                                    }
                                    if (!status.jackpotIsOpen) {
                                        return (
                                            <LoadingButton disabled variant="contained" fullWidth>
                                                Jackpot has not been started yet.
                                            </LoadingButton>
                                        );
                                    }
                                    return (
                                        <LoadingButton fullWidth variant="contained" onClick={() => setOpen(true)}>
                                            PARTICIPATE
                                        </LoadingButton>
                                    );
                                })()}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Card>
            <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
                <Card
                    variant="outlined"
                    sx={{
                        width: '100%',
                        height: '100%',
                        mt: 4,
                        position: 'relative',
                        margin: 'auto',
                        boxShadow: '6px 2px 12px 0px rgba(0, 0, 0, 0.1)',
                        '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                            margin: 0,
                            WebkitAppearance: 'none'
                        },
                        '& input[type=number]': {
                            MozAppearance: 'textfield'
                        }
                    }}
                >
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
                                <TableCell colSpan={2}>
                                    <Stack
                                        spacing={2}
                                        sx={{
                                            p: (theme) => theme.spacing(1, 1),
                                            bgcolor: 'rgba(85, 119, 253, 0.1)',
                                            borderRadius: 1
                                        }}
                                    >
                                        <Stack
                                            direction={'row'}
                                            alignItems="center"
                                            justifyContent={'space-between'}
                                            spacing={2}
                                        >
                                            <Stack direction={'row'} alignItems="flex-end" spacing={1}>
                                                <Button
                                                    color="inherit"
                                                    startIcon={<LoyaltyIcon />}
                                                    sx={{
                                                        p: (theme) => theme.spacing(1, 2),
                                                        bgcolor: 'rgba(0, 0, 0, .25)',
                                                        textTransform: 'none',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(0, 0, 0, .1)'
                                                        }
                                                    }}
                                                >
                                                    <Typography>Ticket</Typography>
                                                </Button>
                                            </Stack>
                                            <TextField
                                                id="ticket-amount"
                                                type="number"
                                                inputProps={{
                                                    placeholder: '0',
                                                    min: 0,
                                                    step: 1
                                                }}
                                                sx={{
                                                    '& input': {
                                                        textAlign: 'right',
                                                        py: 0.75,
                                                        px: 1,
                                                        fontSize: 20
                                                    },
                                                    '& fieldset': {
                                                        border: 'none'
                                                    },
                                                    '& .MuiOutlinedInput-root': {
                                                        paddingRight: 0
                                                    }
                                                }}
                                                disabled={pendingTx}
                                                value={amount}
                                                onChange={handleChange}
                                            />
                                        </Stack>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    <Typography>Balance:</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography textAlign="right">
                                        {(() => {
                                            if (!balance) {
                                                return (
                                                    <Stack component="span" direction="row" alignItems="center">
                                                        <Skeleton
                                                            animation="wave"
                                                            sx={{
                                                                ml: 1,
                                                                minWidth: (theme) => theme.spacing(8)
                                                            }}
                                                        />
                                                    </Stack>
                                                );
                                            }
                                            return `${formatNumber(fromWei(balance, tokens.tefi.decimals), 6)} TEFI`;
                                        })()}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    <Typography>Ticket Price:</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography textAlign="right">
                                        {(() => {
                                            if (!status.priceOfTicket) {
                                                return <Skeleton variant="text" animation="wave" width="100%" />;
                                            }
                                            return `${formatNumber(status.priceOfTicket)} TEFI`;
                                        })()}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    <Typography>You Pay:</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography textAlign="right">
                                        {(() => {
                                            if (!status.priceOfTicket || !amount) {
                                                return <Skeleton variant="text" animation="wave" width="100%" />;
                                            }
                                            return `${formatNumber(status.priceOfTicket * amount)} TEFI`;
                                        })()}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2}>
                                    {(() => {
                                        if (!balance || !amount) {
                                            return (
                                                <LoadingButton disabled variant="contained" fullWidth>
                                                    Enter an amount
                                                </LoadingButton>
                                            );
                                        }
                                        const b = ethersToBigNumber(balance);
                                        const a = toBigNumber(Number(amount));
                                        if (b.isLessThan(a)) {
                                            return (
                                                <LoadingButton disabled variant="contained" fullWidth>
                                                    Insufficient TEFI balance
                                                </LoadingButton>
                                            );
                                        }
                                        if (!isApproved) {
                                            return (
                                                <LoadingButton
                                                    loading={pendingTx}
                                                    onClick={approve}
                                                    variant="contained"
                                                    fullWidth
                                                >
                                                    Approve
                                                </LoadingButton>
                                            );
                                        }
                                        return (
                                            <LoadingButton
                                                loading={pendingTx}
                                                onClick={buyTicket}
                                                variant="contained"
                                                fullWidth
                                            >
                                                Buy
                                            </LoadingButton>
                                        );
                                    })()}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Card>
            </Dialog>
        </Container>
    );
};

export default Lottery;
