// ** React Methods ** //
import { useCallback, useContext, useEffect, useState } from 'react';

// ** Material UI Components ** //
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import useMediaQuery from '@mui/material/useMediaQuery';
import Grid from '@mui/material/Grid';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import CardHeader from '@mui/material/CardHeader';
import MenuItem from '@mui/material/MenuItem';
import Link from '@mui/material/Link';

// ** Material UI Icons ** //
import SwapVertIcon from '@mui/icons-material/SwapVert';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import KeyboardBackspaceRoundedIcon from '@mui/icons-material/KeyboardBackspaceRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';
import TokenRoundedIcon from '@mui/icons-material/TokenRounded';

// ** Extra Components ** //
import TokenChart from 'components/Chart/TokenChart';
import { ToastDescriptionWithTx } from 'components/Toast';

// ** Contexts ** //
import { APIContext } from 'contexts/api';

// ** Utils ** //
import { ethersToBigNumber, formatCurrency, formatNumber, fromWei, toBigNumber, toWei } from 'utils/bigNumber';
import { getBnbBalance } from 'utils/web3';
import { getBscScanLink } from 'utils';

// ** Hooks ** //
import useAuth from 'hooks/useAuth';
import useToast from 'hooks/useToast';
import useConfig from 'hooks/useConfig';
import useCatchTxError from 'hooks/useCatchTxError';
import useActiveWeb3React from 'hooks/useActiveWeb3React';
import { useWalletModal } from 'components/WalletModal';
import { useTokenContract, useSwapContract } from 'hooks/useContract';

// ** Config ** //
import { SWAP_TOKENS, SWAP_TYPES } from 'config/constants/swap';

// ** Types ** //
import { TokenProps } from 'types/swap';
import { ThemeOptions } from '@mui/material';

const Swap = () => {
    const { login, logout } = useAuth();
    const { chainId, account, library } = useActiveWeb3React();
    const { toastSuccess } = useToast();
    const { onPresentConnectModal } = useWalletModal(login, logout);
    const { isChart, activeSwap, onChangeActiveSwap, onChangeChartView } = useConfig();
    const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError();
    const { tokens, activeCurrency } = useContext(APIContext);
    const isMobile = useMediaQuery((theme: ThemeOptions) => theme.breakpoints.down('sm'));

    const swapTokens = SWAP_TOKENS[activeSwap];
    const swapDetail = SWAP_TYPES.find((item) => item.id === activeSwap);

    const [data, setData] = useState<any>({});
    const [isBuy, setIsBuy] = useState(true);
    const [isApproved, setIsApproved] = useState(false);
    const [inputTokenBalance, setInputTokenBalance] = useState<any>();
    const [outputTokenBalance, setOutputTokenBalance] = useState<any>();
    const [isTokenSelect, setIsTokenSelect] = useState<boolean>(false);
    const [selectTarget, setSelectTarget] = useState<string>('input-token');
    const [inputAmount, setInputAmount] = useState<any>({});
    const [outputAmount, setOutputAmount] = useState<any>({});
    const [inputToken, setInputToken] = useState<TokenProps>(swapTokens[0]);
    const [outputToken, setOutputToken] = useState<TokenProps>(swapTokens[1]);
    const [isSwapSelect, setIsSwapSelect] = useState<boolean>(false);
    const [blockNumber, setBlockNumber] = useState<number>();

    const inputTokenContract = useTokenContract(inputToken.address);
    const outputTokenContract = useTokenContract(outputToken.address);
    const swapContract = useSwapContract(activeSwap);

    const resetAmount = () => {
        setInputAmount({
            number: '',
            wei: ''
        });
        setOutputAmount({
            number: '',
            wei: ''
        });
    };

    const checkStatus = () => {
        switch (activeSwap) {
            case 'tefi':
            case 'pumpn':
            case 'webinu': {
                swapContract.paused().then((result) =>
                    setData((prevState) => ({
                        ...prevState,
                        isPause: result
                    }))
                );
                break;
            }
            default: {
                setData((prevState) => ({
                    ...prevState,
                    isPause: false
                }));
            }
        }
    };

    const checkFee = () => {
        switch (activeSwap) {
            case 'pumpn':
            case 'webinu':
            case 'tefi': {
                swapContract.totalBuyFee().then((tFee: string) => {
                    setData((prevState) => ({
                        ...prevState,
                        buyFee: tFee
                    }));
                });
                swapContract.totalSellFee().then((sFee: string) => {
                    setData((prevState) => ({
                        ...prevState,
                        sellFee: sFee
                    }));
                });
                break;
            }
            case 'rtt': {
                swapContract.totalFee().then((tFee: string) => {
                    setData((prevState) => ({
                        ...prevState,
                        buyFee: tFee,
                        sellFee: tFee
                    }));
                });
                break;
            }
            default: {
                swapContract.totalFee().then((tFee: string) => {
                    setData((prevState) => ({
                        ...prevState,
                        buyFee: tFee
                    }));
                    swapContract.sellFee().then((sFee: string) => {
                        const sellFee = Number(tFee) + Number(sFee);
                        setData((prevState) => ({
                            ...prevState,
                            sellFee: sellFee
                        }));
                    });
                });
            }
        }
    };

    const checkBalance = () => {
        if (!account) return;
        if (inputToken.isBase) {
            getBnbBalance(account).then((result) => {
                setInputTokenBalance(ethersToBigNumber(result));
            });
        } else {
            inputTokenContract.balanceOf(account).then((result) => {
                setInputTokenBalance(ethersToBigNumber(result));
            });
        }
        if (outputToken.isBase) {
            getBnbBalance(account).then((result) => {
                setOutputTokenBalance(ethersToBigNumber(result));
            });
        } else {
            outputTokenContract.balanceOf(account).then((result) => {
                setOutputTokenBalance(ethersToBigNumber(result));
            });
        }
    };

    const update = () => {
        checkStatus();
        checkFee();
        checkBalance();
    };

    useEffect(() => {
        if (swapTokens[0]) setInputToken(swapTokens[0]);
        if (swapTokens[1]) setOutputToken(swapTokens[1]);
        resetAmount();
    }, [swapTokens]);

    useEffect(() => {
        setIsApproved(false);
        if (!account) return;
        if (!inputToken.isBase) {
            inputTokenContract.allowance(account, swapContract.address).then((result: any) => {
                const allowance = ethersToBigNumber(result);
                const amount = inputAmount.wei;
                if (allowance.isGreaterThanOrEqualTo(amount)) {
                    setIsApproved(true);
                } else {
                    setIsApproved(false);
                }
            });
        }
    }, [inputToken.address, inputAmount.wei, isBuy]);

    useEffect(() => {
        const interval = setInterval(update, 12000);
        update();
        return () => clearInterval(interval);
    }, [account, chainId, isBuy, inputToken, outputToken]);

    const getCustomGasFee = useCallback(
        async (method: string, args: any) => {
            const gasPrice = await library.getGasPrice();
            const gasLimit = await swapContract.estimateGas[method](...args);
            const estimateGas = ethersToBigNumber(gasLimit);
            const customFee = toBigNumber(300000);
            return {
                gasPrice: gasPrice.toString(),
                gasLimit: estimateGas.plus(customFee).toString()
            };
        },
        [library]
    );

    const buy = async () => {
        const amount = inputAmount.wei.toString();
        let buyTx = null;
        if (inputToken.isBase) {
            const method = 'buy';
            const args = [{ value: amount }];
            const gasOverrides = await getCustomGasFee(method, args);
            buyTx = swapContract.buy({
                value: amount,
                ...gasOverrides
            });
        } else {
            const method = 'buyFromToken';
            const args = [inputToken.address, amount];
            const gasOverrides = await getCustomGasFee(method, args);
            buyTx = swapContract.buyFromToken(inputToken.address, amount, {
                ...gasOverrides
            });
        }
        const receipt = await fetchWithCatchTxError(() => {
            return buyTx;
        });
        if (receipt?.status) {
            update();
            resetAmount();
            toastSuccess(
                'Bought',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    {`You have bought ${outputAmount.number} ${outputToken.symbol}!`}
                </ToastDescriptionWithTx>
            );
        }
    };

    const sell = async () => {
        const amount = inputAmount.wei.toString();
        const method = 'sell';
        const args = [amount];
        const gasOverrides = await getCustomGasFee(method, args);
        const receipt = await fetchWithCatchTxError(() => {
            return swapContract.sell(amount, {
                ...gasOverrides
            });
        });
        if (receipt?.status) {
            update();
            resetAmount();
            toastSuccess(
                'Sold',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    {`You have sold ${inputAmount.number} ${inputToken.symbol}!`}
                </ToastDescriptionWithTx>
            );
        }
    };

    const approve = async () => {
        const spender = swapContract.address;
        const ts = await inputTokenContract.totalSupply();
        const receipt = await fetchWithCatchTxError(() => {
            return inputTokenContract.approve(spender, ts);
        });
        if (receipt?.status) {
            setIsApproved(true);
            toastSuccess(
                'Approved',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    {`You can now buy or sell your ${inputToken.symbol}!`}
                </ToastDescriptionWithTx>
            );
        }
    };

    const updateOutByInput = (value) => {
        const amount = value.toString();
        if (Number(value) <= 0) {
            return setOutputAmount({
                number: '',
                wei: ''
            });
        } else {
            if (isBuy) {
                let method = null;
                if (activeSwap === 'tefi') {
                    method = swapContract.getAmountOutFromBuy(inputToken.address, amount);
                } else {
                    method = swapContract.getAmountOutFromBuy(amount);
                }
                method
                    .then(({ amountOut }) => {
                        setOutputAmount({
                            number: fromWei(amountOut, outputToken.decimals),
                            wei: ethersToBigNumber(amountOut)
                        });
                    })
                    .catch(() => {
                        setOutputAmount({
                            number: '',
                            wei: ''
                        });
                    });
            } else {
                swapContract
                    .getAmountOutFromSell(amount)
                    .then(({ amountOut }) => {
                        setOutputAmount({
                            number: fromWei(amountOut, outputToken.decimals),
                            wei: ethersToBigNumber(amountOut)
                        });
                    })
                    .catch(() => {
                        setOutputAmount({
                            number: '',
                            wei: ''
                        });
                    });
            }
        }
    };

    const updateInByOutput = (value) => {
        const amount = value.toString();
        if (Number(value) <= 0) {
            return setInputAmount({
                number: '',
                wei: ''
            });
        } else {
            if (isBuy) {
                let method = null;
                if (activeSwap === 'tefi') {
                    method = swapContract.getAmountInFromBuy(inputToken.address, amount);
                } else {
                    method = swapContract.getAmountInFromBuy(amount);
                }
                method
                    .then(({ amountIn }) => {
                        setInputAmount({
                            number: fromWei(amountIn, inputToken.decimals),
                            wei: ethersToBigNumber(amountIn)
                        });
                    })
                    .catch(() => {
                        setInputAmount({
                            number: '',
                            wei: ''
                        });
                    });
            } else {
                swapContract
                    .getAmountInFromSell(amount)
                    .then(({ amountIn }) => {
                        setInputAmount({
                            number: fromWei(amountIn, inputToken.decimals),
                            wei: ethersToBigNumber(amountIn)
                        });
                    })
                    .catch(() => {
                        setInputAmount({
                            number: '',
                            wei: ''
                        });
                    });
            }
        }
    };

    const openTokenSelect = (target: string) => {
        if (!getActiveTokenList(target).length) return;
        setSelectTarget(target);
        setIsTokenSelect(true);
    };
    const closeTokenSelect = () => {
        setIsTokenSelect(false);
    };

    const openSwapTypeModal = () => {
        setIsSwapSelect(true);
    };
    const closeSwapTypeModal = () => {
        setIsSwapSelect(false);
    };

    const selectSwapType = (id) => {
        onChangeActiveSwap(id);
        setIsBuy(true);
        closeSwapTypeModal();
    };

    const handleChange = (event) => {
        const {
            target: { id, value }
        } = event;
        if (id === 'input-token') {
            updateOutByInput(toWei(value, inputToken.decimals));
            setInputAmount({
                wei: toWei(value, inputToken.decimals),
                number: value
            });
        } else {
            updateInByOutput(toWei(value, outputToken.decimals));
            setOutputAmount({
                wei: toWei(value, outputToken.decimals),
                number: value
            });
        }
    };

    const setMax = () => {
        updateOutByInput(inputTokenBalance);
        setInputAmount({
            number: fromWei(inputTokenBalance, inputToken.decimals),
            wei: inputTokenBalance
        });
    };

    const exchangeBaseQuote = () => {
        const tempB = outputToken;
        const tempQ = inputToken;
        setInputToken(tempB);
        setOutputToken(tempQ);
        setIsBuy(!isBuy);
        setInputAmount(outputAmount);
        setOutputAmount(inputAmount);
    };

    const getActiveTokenList = (target: string) => {
        const sTarget = target ?? selectTarget;
        return swapTokens.filter((item) => {
            let flag = true;
            if (inputToken.id === item.id) flag = false;
            if (outputToken.id === item.id) flag = false;
            if (sTarget === 'input-token') {
                if (!item.method.find((method) => method === 'buy') || outputToken.id !== 'tefi') flag = false;
            } else {
                if (!item.method.find((method) => method === 'sell') || inputToken.id !== 'tefi') flag = false;
            }
            return flag;
        });
    };

    const listener = (bn: number) => {
        setBlockNumber(bn);
        // library.getBlockWithTransactions(bn).then((block: any) => {
        //     const { transactions } = block;
        //     const result = transactions.filter((item) => item.from === account);
        // });
    };

    useEffect(() => {
        library.getBlockNumber().then(setBlockNumber);
        library.on('block', listener);
        return () => {
            library.removeListener('block', listener);
        };
    }, [library, account]);

    return (
        <Container sx={{ py: 4 }} maxWidth="xl">
            {!isMobile && (
                <Link underline="none" target="_blank" href={getBscScanLink(blockNumber, 'block')}>
                    <Card
                        variant="outlined"
                        component={Stack}
                        alignItems="center"
                        direction="row"
                        spacing={1}
                        sx={{
                            position: 'fixed',
                            bottom: (theme) => theme.spacing(8),
                            left: (theme) => theme.spacing(2),
                            p: (theme) => theme.spacing(1)
                        }}
                    >
                        <TokenRoundedIcon fontSize="small" />
                        <Typography color="textSecondary" sx={{ pt: 0.25 }}>
                            {blockNumber ?? 0}
                        </Typography>
                    </Card>
                </Link>
            )}
            <Grid container spacing={2}>
                {(() => {
                    if (isMobile || !isChart) return <></>;
                    return (
                        <Grid item xs={12} sm={8}>
                            <Card
                                component={Stack}
                                sx={{
                                    height: '100%',
                                    borderColor: 'divider',
                                    borderWidth: 1,
                                    borderStyle: 'solid',
                                    overflow: 'visible'
                                }}
                            >
                                <TokenChart inputToken={inputToken} outputToken={outputToken} />
                            </Card>
                        </Grid>
                    );
                })()}
                <Grid item xs={12} sm={isChart ? 4 : 12}>
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
                        <Box sx={{ visibility: isSwapSelect ? 'hidden' : 'visible' }}>
                            <Stack
                                justifyContent="center"
                                alignItems="center"
                                direction="row"
                                sx={{
                                    p: (theme) => theme.spacing(3),
                                    '& button': {
                                        borderWidth: 1,
                                        borderStyle: 'solid',
                                        borderColor: 'divider'
                                    }
                                }}
                            >
                                <Stack alignItems="center">
                                    <Typography variant="h6">Swap</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Trade tokens in an instant
                                    </Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.5} sx={{ display: 'none' }}>
                                    <Tooltip title="View Chart" arrow>
                                        <IconButton onClick={onChangeChartView}>
                                            <ShowChartRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="View Latest Transactions" arrow>
                                        <IconButton>
                                            <HistoryRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Settings" arrow>
                                        <IconButton>
                                            <SettingsRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Stack>
                            <Divider flexItem />
                            <CardHeader
                                avatar={
                                    <Avatar src={swapDetail.icon} alt={swapDetail.label}>
                                        R
                                    </Avatar>
                                }
                                action={
                                    <Stack>
                                        <KeyboardArrowUpRoundedIcon
                                            sx={{ fontSize: 16, lineHeight: '8px', mb: -3 / 8 }}
                                        />
                                        <KeyboardArrowDownRoundedIcon
                                            sx={{ fontSize: 16, lineHeight: '8px', mt: -3 / 8 }}
                                        />
                                    </Stack>
                                }
                                sx={{
                                    bgcolor: 'rgba(85, 119, 253, 0.1)',
                                    cursor: 'pointer',
                                    px: 2,
                                    mx: 3,
                                    mt: 3,
                                    borderRadius: 1,
                                    '& .MuiCardHeader-action': {
                                        alignSelf: 'center',
                                        margin: 0
                                    }
                                }}
                                onClick={openSwapTypeModal}
                                title={swapDetail.label}
                                subheader={swapDetail.description}
                            />
                            <CardContent
                                component={Stack}
                                alignItems="center"
                                direction="column"
                                justifyContent="space-between"
                                sx={{
                                    p: (theme) => theme.spacing(3)
                                }}
                            >
                                <Stack
                                    direction={'column'}
                                    sx={{
                                        width: '100%'
                                    }}
                                >
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
                                                    startIcon={
                                                        <Box
                                                            component="img"
                                                            sx={{
                                                                height: (theme) => theme.spacing(2.5),
                                                                width: (theme) => theme.spacing(2.5),
                                                                borderRadius: 50
                                                            }}
                                                            src={inputToken.icon}
                                                        />
                                                    }
                                                    endIcon={
                                                        getActiveTokenList('input-token').length > 0 ? (
                                                            <Stack>
                                                                <KeyboardArrowUpRoundedIcon
                                                                    sx={{ fontSize: 14, lineHeight: '8px', mb: -3 / 8 }}
                                                                />
                                                                <KeyboardArrowDownRoundedIcon
                                                                    sx={{ fontSize: 14, lineHeight: '8px', mt: -3 / 8 }}
                                                                />
                                                            </Stack>
                                                        ) : (
                                                            <></>
                                                        )
                                                    }
                                                    onClick={() => openTokenSelect('input-token')}
                                                    sx={{
                                                        p: (theme) => theme.spacing(1, 2),
                                                        bgcolor: 'rgba(0, 0, 0, .25)',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(0, 0, 0, .1)'
                                                        }
                                                    }}
                                                >
                                                    <Typography>{inputToken.symbol}</Typography>
                                                </Button>
                                            </Stack>
                                            <TextField
                                                id="input-token"
                                                type="number"
                                                inputProps={{
                                                    placeholder: '0.00',
                                                    min: 0,
                                                    step: 0.01
                                                }}
                                                sx={{
                                                    '& input': {
                                                        textAlign: 'right',
                                                        py: 0.75,
                                                        px: 0,
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
                                                value={inputAmount.number ?? ''}
                                                onChange={handleChange}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                onClick={setMax}
                                                                disabled={!inputTokenBalance}
                                                                sx={{
                                                                    minWidth: (theme) => theme.spacing(5),
                                                                    lineHeight: 1,
                                                                    p: 0.5
                                                                }}
                                                            >
                                                                Max
                                                            </Button>
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="caption" color="textSecondary">
                                                {(() => {
                                                    if (!inputTokenBalance) {
                                                        return (
                                                            <Stack component="span" direction="row" alignItems="center">
                                                                Balance:
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
                                                    return `Balance: ${formatNumber(
                                                        fromWei(inputTokenBalance, inputToken.decimals),
                                                        6
                                                    )}`;
                                                })()}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {(() => {
                                                    if (!tokens[inputToken.apiId]) {
                                                        return <></>;
                                                    }
                                                    if (!inputAmount.wei) {
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
                                                    return `~ ${formatCurrency(
                                                        fromWei(inputAmount.wei, inputToken.decimals) *
                                                            tokens[inputToken.apiId].current_price,
                                                        activeCurrency
                                                    )}`;
                                                })()}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                    <Divider>
                                        <IconButton
                                            disabled={!inputToken.method.find((item) => item === 'sell')}
                                            onClick={exchangeBaseQuote}
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(255, 255, 255, .05)',
                                                mt: 3,
                                                mb: 3
                                            }}
                                        >
                                            <SwapVertIcon fontSize="small" />
                                        </IconButton>
                                    </Divider>
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
                                                    startIcon={
                                                        <Box
                                                            component="img"
                                                            sx={{
                                                                height: (theme) => theme.spacing(2.5),
                                                                width: (theme) => theme.spacing(2.5),
                                                                borderRadius: 50
                                                            }}
                                                            src={outputToken.icon}
                                                        />
                                                    }
                                                    endIcon={
                                                        getActiveTokenList('output-token').length > 0 ? (
                                                            <Stack>
                                                                <KeyboardArrowUpRoundedIcon
                                                                    sx={{ fontSize: 14, lineHeight: '8px', mb: -3 / 8 }}
                                                                />
                                                                <KeyboardArrowDownRoundedIcon
                                                                    sx={{ fontSize: 14, lineHeight: '8px', mt: -3 / 8 }}
                                                                />
                                                            </Stack>
                                                        ) : (
                                                            <></>
                                                        )
                                                    }
                                                    onClick={() => openTokenSelect('output-token')}
                                                    sx={{
                                                        p: (theme) => theme.spacing(1, 2),
                                                        bgcolor: 'rgba(0, 0, 0, .25)',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(0, 0, 0, .1)'
                                                        }
                                                    }}
                                                >
                                                    <Typography>{outputToken.symbol}</Typography>
                                                </Button>
                                            </Stack>
                                            <TextField
                                                id="output-token"
                                                type="number"
                                                inputProps={{
                                                    placeholder: '0.00',
                                                    min: 0,
                                                    step: 0.01
                                                }}
                                                sx={{
                                                    '& input': {
                                                        textAlign: 'right',
                                                        py: 0.75,
                                                        px: 0,
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
                                                value={outputAmount.number ?? ''}
                                                onChange={handleChange}
                                            />
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="caption" color="textSecondary">
                                                {(() => {
                                                    if (!outputTokenBalance) {
                                                        return (
                                                            <Stack component="span" direction="row" alignItems="center">
                                                                Balance:
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
                                                    return `Balance: ${formatNumber(
                                                        fromWei(outputTokenBalance, outputToken.decimals),
                                                        6
                                                    )}`;
                                                })()}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {(() => {
                                                    if (!tokens[outputToken.apiId]) {
                                                        return <></>;
                                                    }
                                                    if (!outputAmount.wei) {
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
                                                    return `~ ${formatCurrency(
                                                        fromWei(outputAmount.wei, outputToken.decimals) *
                                                            tokens[outputToken.apiId].current_price,
                                                        activeCurrency
                                                    )}`;
                                                })()}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                    <Divider sx={{ my: 3 }}>
                                        <Typography color="textSecondary" variant="subtitle2">
                                            {!data.buyFee || !data.sellFee ? (
                                                <Skeleton sx={{ minWidth: 80 }} animation="wave" />
                                            ) : isBuy ? (
                                                `Buy Fee: ${formatNumber(
                                                    (data.buyFee * 100) / swapDetail.dominator,
                                                    1
                                                )}%`
                                            ) : (
                                                `Sell Fee: ${formatNumber(
                                                    (data.sellFee * 100) / swapDetail.dominator,
                                                    1
                                                )}%`
                                            )}
                                        </Typography>
                                    </Divider>
                                    {(() => {
                                        if (!account) {
                                            return (
                                                <LoadingButton
                                                    size="large"
                                                    variant="contained"
                                                    onClick={onPresentConnectModal}
                                                >
                                                    Connect Wallet
                                                </LoadingButton>
                                            );
                                        } else {
                                            if (data.isPause) {
                                                return (
                                                    <LoadingButton size="large" variant="contained" disabled>
                                                        Trading isn't enabled yet
                                                    </LoadingButton>
                                                );
                                            }
                                            if (!inputAmount.number || !outputAmount.number) {
                                                return (
                                                    <LoadingButton size="large" variant="contained" disabled>
                                                        Enter an amount
                                                    </LoadingButton>
                                                );
                                            }
                                            if (!inputTokenBalance) {
                                                return (
                                                    <LoadingButton size="large" variant="contained" disabled>
                                                        Insufficient {inputToken.symbol} balance
                                                    </LoadingButton>
                                                );
                                            }
                                            const inab = toBigNumber(inputAmount.wei);
                                            const itb = toBigNumber(inputTokenBalance);
                                            if (inab.isGreaterThan(itb)) {
                                                return (
                                                    <LoadingButton size="large" variant="contained" disabled>
                                                        Insufficient {inputToken.symbol} balance
                                                    </LoadingButton>
                                                );
                                            }
                                            if (isBuy) {
                                                if (!isApproved && !inputToken.isBase) {
                                                    return (
                                                        <LoadingButton
                                                            loading={pendingTx}
                                                            size="large"
                                                            variant="contained"
                                                            onClick={approve}
                                                        >
                                                            approve
                                                        </LoadingButton>
                                                    );
                                                }
                                                return (
                                                    <LoadingButton
                                                        loading={pendingTx}
                                                        size="large"
                                                        variant="contained"
                                                        onClick={buy}
                                                    >
                                                        Buy
                                                    </LoadingButton>
                                                );
                                            } else {
                                                if (!isApproved && !inputToken.isBase) {
                                                    return (
                                                        <LoadingButton
                                                            loading={pendingTx}
                                                            size="large"
                                                            variant="contained"
                                                            onClick={approve}
                                                        >
                                                            approve
                                                        </LoadingButton>
                                                    );
                                                }
                                                return (
                                                    <LoadingButton
                                                        loading={pendingTx}
                                                        size="large"
                                                        variant="contained"
                                                        onClick={sell}
                                                    >
                                                        SELL
                                                    </LoadingButton>
                                                );
                                            }
                                        }
                                    })()}
                                </Stack>
                            </CardContent>
                        </Box>
                        <Card
                            sx={{
                                position: 'absolute',
                                display: isSwapSelect ? 'block' : 'none',
                                width: '100%',
                                height: '100%',
                                top: 0,
                                left: 0,
                                zIndex: 1000
                            }}
                        >
                            <Stack
                                direction="row"
                                alignItems="flex-end"
                                justifyContent="center"
                                sx={{ position: 'relative', py: 3, px: 1 }}
                            >
                                <IconButton
                                    size="small"
                                    color="inherit"
                                    onClick={closeSwapTypeModal}
                                    sx={{
                                        borderWidth: 1,
                                        borderStyle: 'solid',
                                        borderColor: 'divider',
                                        position: 'absolute',
                                        left: 16,
                                        top: 16,
                                        textTransform: 'none'
                                    }}
                                >
                                    <KeyboardBackspaceRoundedIcon fontSize="small" />
                                </IconButton>
                                <Stack alignItems="center">
                                    <Typography variant="h6">Select Swap</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Select Swap based on your token.
                                    </Typography>
                                </Stack>
                            </Stack>
                            <Divider flexItem />
                            <CardContent
                                sx={{
                                    p: (theme) => theme.spacing(3)
                                }}
                            >
                                {SWAP_TYPES.map((swap) => (
                                    <MenuItem
                                        selected={swap.id === activeSwap}
                                        key={swap.id}
                                        onClick={() => selectSwapType(swap.id)}
                                        sx={{
                                            px: 2,
                                            py: 2,
                                            borderRadius: 1,
                                            '&.Mui-selected': {
                                                bgcolor: 'rgba(85, 119, 253, 0.1)'
                                            }
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                src={swap.icon}
                                                alt={swap.label}
                                                sx={{
                                                    borderRadius: 10
                                                }}
                                            />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={swap.label}
                                            secondary={swap.description}
                                            primaryTypographyProps={{ variant: 'body2' }}
                                        />
                                        {swap.id === activeSwap ? (
                                            <CheckCircleRoundedIcon sx={{ color: 'secondary.light' }} />
                                        ) : (
                                            <CircleRoundedIcon color="disabled" />
                                        )}
                                    </MenuItem>
                                ))}
                            </CardContent>
                        </Card>
                    </Card>
                </Grid>
            </Grid>
            <Dialog maxWidth="xs" fullWidth onClose={closeTokenSelect} open={isTokenSelect}>
                <DialogTitle>Select Token</DialogTitle>
                <DialogContent dividers sx={{ borderBottom: 'none' }}>
                    <List>
                        {getActiveTokenList(selectTarget).map((item) => {
                            return (
                                <ListItem disablePadding key={item.id}>
                                    <ListItemButton
                                        onClick={() => {
                                            resetAmount();
                                            closeTokenSelect();
                                            setIsApproved(false);
                                            return selectTarget === 'input-token'
                                                ? setInputToken(item)
                                                : setOutputToken(item);
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar src={item.icon} alt={item.symbol} />
                                        </ListItemAvatar>
                                        <ListItemText primary={item.symbol} secondary="Binance Smart Chain Token" />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default Swap;
