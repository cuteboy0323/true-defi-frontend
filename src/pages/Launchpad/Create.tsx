import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { ToastDescriptionWithTx } from 'components/Toast';

import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import QuestionMarkRoundedIcon from '@mui/icons-material/QuestionMarkRounded';

import useAuth from 'hooks/useAuth';
import useToast from 'hooks/useToast';
import useCatchTxError from 'hooks/useCatchTxError';
import useActiveWeb3React from 'hooks/useActiveWeb3React';
import { useNavigate } from 'react-router-dom';
import { useWalletModal } from 'components/WalletModal';
import { useTokenContract, useLaunchpadContract } from 'hooks/useContract';

import BEP20 from 'config/abi/bep20.json';
import multicall from 'utils/multicall';
import { formatNumber, fromWei, toWei } from 'utils/bigNumber';

const Create = () => {
    const [imageLink, setImageLink] = useState<string>('');

    const { account } = useActiveWeb3React();

    const navigate = useNavigate();

    const { login, logout } = useAuth();
    const { toastSuccess } = useToast();
    const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError();
    const { onPresentConnectModal } = useWalletModal(login, logout);

    const [activeStep, setActiveStep] = useState<number>(0);
    const [presale, setPresale] = useState<any>({
        hardcap: 10000,
        softcap: 0,
        max: 100,
        min: 0,
        start: new Date(new Date().getTime() + 1 * 60 * 60 * 1000),
        end: new Date(new Date().getTime() + 25 * 60 * 60 * 1000)
    });

    const tokenContract = useTokenContract(presale.token);
    const launchpadContract = useLaunchpadContract();

    const handleChange = (newValue: Date | null, name: string) => {
        setPresale((prevState: any) => ({
            ...prevState,
            [name]: newValue
        }));
    };

    const handlePresaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPresale((prevState: any) => ({
            ...prevState,
            [event.target.name]: event.target.value
        }));
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setImageLink(event.target.value);
    };

    const getEtherDate = (date: any) => {
        return Math.floor(new Date(date).getTime() / 1000);
    };

    const createPresale = async () => {
        const receipt = await fetchWithCatchTxError(() => {
            return launchpadContract.deploy(
                presale.token,
                imageLink,
                toWei(presale.hardcap).toString(),
                toWei(presale.softcap).toString(),
                toWei(presale.max).toString(),
                toWei(presale.min).toString(),
                getEtherDate(presale.start),
                getEtherDate(presale.end),
                toWei(presale.price, presale.decimals).toString(),
                presale.isPublic
            );
        });
        if (receipt?.status) {
            toastSuccess(
                'Created',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    {`You have created your own presale!`}
                </ToastDescriptionWithTx>
            );
            navigate('/launchpad/list');
        }
    };

    const isValidLink = useMemo(() => {
        if (!imageLink) return false;
        if (!imageLink.includes('http')) return false;
        if (!imageLink.includes('https')) return false;
        return true;
    }, [imageLink]);

    useEffect(() => {
        (async () => {
            if (!tokenContract) return;
            const methods = ['name', 'symbol', 'decimals', 'totalSupply'];
            const calls = methods.map((method) => ({
                address: tokenContract.address,
                name: method
            }));
            const psaleResult = await multicall(BEP20, calls);
            psaleResult.forEach((result: any, idx: number) => {
                setPresale((prevState) => ({
                    ...prevState,
                    [methods[idx]]: result[0]
                }));
            });
        })();
    }, [tokenContract]);

    useEffect(() => {
        if (!presale.token) return;
        launchpadContract.whitelist(presale.token).then((result) => {
            setPresale((prevState: any) => ({
                ...prevState,
                isWhitelist: result
            }));
        });
    }, [presale.token]);

    const dragAdrop = (
        <Card
            sx={{
                width: '100%',
                height: '100%',
                bgcolor: 'rgba(85, 119, 253, 0.1)',
                boxShadow: 'none',
                border: '2px dashed #31343F',
                position: 'relative'
            }}
        >
            {isValidLink ? (
                <>
                    <Box
                        component="img"
                        src={imageLink}
                        alt="Logo"
                        sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                    <IconButton
                        onClick={() => setImageLink(null)}
                        sx={{
                            position: 'absolute',
                            right: 16,
                            top: 16,
                            bgcolor: 'secondary.main'
                        }}
                    >
                        <CloseRoundedIcon />
                    </IconButton>
                </>
            ) : (
                <CardContent
                    width="100%"
                    height="100%"
                    component={Stack}
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}
                >
                    <Box component="img" src={require('assets/img/icons/paper-clip.svg').default} alt="Menu" mb={2} />
                    <Typography variant="h6">Logo link</Typography>
                    <Typography variant="caption" color="textSecondary" textAlign="center">
                        Input your online logo link.
                    </Typography>
                    <TextField
                        value={imageLink}
                        onChange={handleImageChange}
                        variant="filled"
                        error={!isValidLink}
                        helperText={!isValidLink && imageLink !== '' ? 'Invalid image link.' : ''}
                    />
                </CardContent>
            )}
        </Card>
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
            <Card variant="outlined" sx={{ py: 4, position: 'relative' }}>
                <CardContent>
                    <Stack>
                        <Typography variant="h5" textAlign="center">
                            Create Presale
                        </Typography>
                        <Stack px={{ xs: 2, sm: 6 }} py={4}>
                            <Grid container>
                                <Grid
                                    item
                                    xs={12}
                                    sm={4}
                                    sx={{
                                        borderBottomWidth: 2,
                                        borderBottomStyle: 'solid',
                                        pb: 2,
                                        borderBottomColor: activeStep === 0 ? 'primary.main' : 'rgba(254, 80, 143, 0.3)'
                                    }}
                                >
                                    <Stack justifyContent="flex-start" direction="row" alignItems="center" spacing={2}>
                                        {(() => {
                                            if (activeStep > 0) {
                                                return <CheckCircleRoundedIcon color="primary" />;
                                            }
                                            if (activeStep === 0) {
                                                return <RadioButtonCheckedIcon color="primary" />;
                                            }
                                            if (activeStep < 0) {
                                                return <RadioButtonUncheckedIcon color="primary" />;
                                            }
                                        })()}
                                        <Stack>
                                            <Typography>STEP 1</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Set Token To Publish
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </Grid>
                                <Grid
                                    item
                                    xs={12}
                                    sm={4}
                                    sx={{
                                        borderBottomWidth: 2,
                                        borderBottomStyle: 'solid',
                                        pb: 2,
                                        borderBottomColor: activeStep === 1 ? 'primary.main' : 'rgba(254, 80, 143, 0.3)'
                                    }}
                                >
                                    <Stack justifyContent="center" direction="row" alignItems="center" spacing={2}>
                                        {(() => {
                                            if (activeStep > 1) {
                                                return <CheckCircleRoundedIcon color="primary" />;
                                            }
                                            if (activeStep === 1) {
                                                return <RadioButtonCheckedIcon color="primary" />;
                                            }
                                            if (activeStep < 1) {
                                                return <RadioButtonUncheckedIcon color="primary" />;
                                            }
                                        })()}
                                        <Stack>
                                            <Typography>STEP 2</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Set Limit For Token
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </Grid>
                                <Grid
                                    item
                                    xs={12}
                                    sm={4}
                                    sx={{
                                        borderBottomWidth: 2,
                                        borderBottomStyle: 'solid',
                                        pb: 2,
                                        borderBottomColor: activeStep === 2 ? 'primary.main' : 'rgba(254, 80, 143, 0.3)'
                                    }}
                                >
                                    <Stack justifyContent="flex-end" direction="row" alignItems="center" spacing={2}>
                                        {(() => {
                                            if (activeStep > 2) {
                                                return <CheckCircleRoundedIcon color="primary" />;
                                            }
                                            if (activeStep === 2) {
                                                return <RadioButtonCheckedIcon color="primary" />;
                                            }
                                            if (activeStep < 2) {
                                                return <RadioButtonUncheckedIcon color="primary" />;
                                            }
                                        })()}
                                        <Stack>
                                            <Typography>STEP 3</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Pool Configuration
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </Grid>
                            </Grid>
                            {(() => {
                                switch (activeStep) {
                                    case 0: {
                                        return (
                                            <Grid container spacing={4} my={2}>
                                                <Grid item xs={12} sm={6}>
                                                    {dragAdrop}
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box display="flex" flexDirection="column" gap={4}>
                                                        <Stack spacing={1}>
                                                            <Typography>Token Address:</Typography>
                                                            <TextField
                                                                variant="filled"
                                                                name="token"
                                                                value={presale.token ?? ''}
                                                                onChange={handlePresaleChange}
                                                                error={!presale.isWhitelist}
                                                                helperText={
                                                                    !presale.isWhitelist && presale.token
                                                                        ? 'Token is not whitelisted.'
                                                                        : ''
                                                                }
                                                            />
                                                        </Stack>
                                                        <Grid container spacing={2}>
                                                            <Grid item xs={12} sm={7}>
                                                                <Stack spacing={1}>
                                                                    <Typography>Name:</Typography>
                                                                    <TextField
                                                                        variant="filled"
                                                                        inputProps={{
                                                                            readOnly: true,
                                                                            sx: {
                                                                                cursor: 'pointer'
                                                                            }
                                                                        }}
                                                                        value={presale.name ?? ''}
                                                                    />
                                                                </Stack>
                                                            </Grid>
                                                            <Grid item xs={12} sm={5}>
                                                                <Stack spacing={1}>
                                                                    <Typography>Ticker:</Typography>
                                                                    <TextField
                                                                        variant="filled"
                                                                        inputProps={{
                                                                            readOnly: true,
                                                                            sx: {
                                                                                cursor: 'pointer'
                                                                            }
                                                                        }}
                                                                        value={presale.symbol ?? ''}
                                                                    />
                                                                </Stack>
                                                            </Grid>
                                                            <Grid item xs={12} sm={4}>
                                                                <Stack spacing={1}>
                                                                    <Typography>Decimals:</Typography>
                                                                    <TextField
                                                                        variant="filled"
                                                                        inputProps={{
                                                                            readOnly: true,
                                                                            sx: {
                                                                                cursor: 'pointer'
                                                                            }
                                                                        }}
                                                                        value={presale.decimals ?? ''}
                                                                    />
                                                                </Stack>
                                                            </Grid>
                                                            <Grid item xs={12} sm={8}>
                                                                <Stack spacing={1}>
                                                                    <Typography>Total Supply:</Typography>
                                                                    <TextField
                                                                        variant="filled"
                                                                        inputProps={{
                                                                            readOnly: true,
                                                                            sx: {
                                                                                cursor: 'pointer'
                                                                            }
                                                                        }}
                                                                        value={
                                                                            presale.totalSupply
                                                                                ? formatNumber(
                                                                                      fromWei(
                                                                                          presale.totalSupply,
                                                                                          presale.decimals
                                                                                      )
                                                                                  )
                                                                                : ''
                                                                        }
                                                                    />
                                                                </Stack>
                                                            </Grid>
                                                        </Grid>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        );
                                    }
                                    case 1: {
                                        return (
                                            <Grid container spacing={4} my={2}>
                                                <Grid item xs={12} sm={6}>
                                                    {dragAdrop}
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box display="flex" flexDirection="column" gap={4}>
                                                        <Grid container spacing={3}>
                                                            <Grid item xs={12} sm={6}>
                                                                <Stack spacing={1}>
                                                                    <Typography>Hard Cap:</Typography>
                                                                    <TextField
                                                                        variant="filled"
                                                                        name="hardcap"
                                                                        value={presale.hardcap ?? ''}
                                                                        onChange={handlePresaleChange}
                                                                        type="number"
                                                                        error
                                                                        helperText={
                                                                            Number(presale.hardcap) <
                                                                            Number(presale.softcap)
                                                                                ? 'Hard Cap should be greater than soft cap'
                                                                                : ' '
                                                                        }
                                                                    />
                                                                </Stack>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6}>
                                                                <Stack spacing={1}>
                                                                    <Typography>Soft Cap:</Typography>
                                                                    <TextField
                                                                        variant="filled"
                                                                        name="softcap"
                                                                        value={presale.softcap ?? ''}
                                                                        onChange={handlePresaleChange}
                                                                        type="number"
                                                                        error
                                                                        helperText={
                                                                            Number(presale.hardcap) <
                                                                            Number(presale.softcap)
                                                                                ? 'Soft Cap should be less than hard cap'
                                                                                : ' '
                                                                        }
                                                                    />
                                                                </Stack>
                                                            </Grid>
                                                            <Grid item xs={12} sm={12}>
                                                                <Stack spacing={1}>
                                                                    <Typography>Maximum Investable Amount:</Typography>
                                                                    <TextField
                                                                        variant="filled"
                                                                        name="max"
                                                                        value={presale.max ?? ''}
                                                                        onChange={handlePresaleChange}
                                                                        type="number"
                                                                        error
                                                                        helperText={
                                                                            Number(presale.max) < Number(presale.min)
                                                                                ? 'Max amount should be greater than min amount.'
                                                                                : ''
                                                                        }
                                                                    />
                                                                </Stack>
                                                            </Grid>
                                                            <Grid item xs={12} sm={12}>
                                                                <Stack spacing={1}>
                                                                    <Typography>Minimum Investable Amount:</Typography>
                                                                    <TextField
                                                                        variant="filled"
                                                                        name="min"
                                                                        value={presale.min ?? ''}
                                                                        onChange={handlePresaleChange}
                                                                        type="number"
                                                                        error
                                                                        helperText={
                                                                            Number(presale.max) < Number(presale.min)
                                                                                ? 'Min amount should be less than max amount.'
                                                                                : ''
                                                                        }
                                                                    />
                                                                </Stack>
                                                            </Grid>
                                                        </Grid>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        );
                                    }
                                    case 2: {
                                        return (
                                            <Grid container spacing={4} my={2}>
                                                <Grid item xs={6}>
                                                    {dragAdrop}
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Box display="flex" flexDirection="column" gap={2}>
                                                        <Stack spacing={1}>
                                                            <Typography>Start Time</Typography>
                                                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                                <DateTimePicker
                                                                    value={presale.start ?? new Date()}
                                                                    onChange={(value: any) =>
                                                                        handleChange(value, 'start')
                                                                    }
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
                                                                        return (
                                                                            <TextField variant="filled" {...params} />
                                                                        );
                                                                    }}
                                                                />
                                                            </LocalizationProvider>
                                                        </Stack>
                                                        <Stack spacing={1}>
                                                            <Typography>End Time</Typography>
                                                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                                <DateTimePicker
                                                                    value={presale.end ?? new Date()}
                                                                    onChange={(value: any) =>
                                                                        handleChange(value, 'end')
                                                                    }
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
                                                                        return (
                                                                            <TextField variant="filled" {...params} />
                                                                        );
                                                                    }}
                                                                />
                                                            </LocalizationProvider>
                                                        </Stack>
                                                        <Stack spacing={1}>
                                                            <Typography>Tokens Per BNB</Typography>
                                                            <TextField
                                                                type="number"
                                                                variant="filled"
                                                                name="price"
                                                                value={presale.price ?? ''}
                                                                onChange={handlePresaleChange}
                                                            />
                                                        </Stack>
                                                        <Stack spacing={1}>
                                                            <Typography>Is Whitelist Mode?</Typography>
                                                            <Stack alignSelf="flex-start" direction="row" spacing={1}>
                                                                <Button
                                                                    variant={
                                                                        !presale.isPublic ? 'contained' : 'outlined'
                                                                    }
                                                                    color="secondary"
                                                                    startIcon={<CheckRoundedIcon fontSize="small" />}
                                                                    onClick={() => {
                                                                        setPresale((prevState: any) => ({
                                                                            ...prevState,
                                                                            isPublic: false
                                                                        }));
                                                                    }}
                                                                    sx={{
                                                                        px: 3
                                                                    }}
                                                                >
                                                                    Yes
                                                                </Button>
                                                                <Button
                                                                    variant={
                                                                        !presale.isPublic ? 'outlined' : 'contained'
                                                                    }
                                                                    color="secondary"
                                                                    startIcon={<CloseRoundedIcon fontSize="small" />}
                                                                    onClick={() => {
                                                                        setPresale((prevState: any) => ({
                                                                            ...prevState,
                                                                            isPublic: true
                                                                        }));
                                                                    }}
                                                                    sx={{
                                                                        px: 3
                                                                    }}
                                                                >
                                                                    No
                                                                </Button>
                                                            </Stack>
                                                        </Stack>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        );
                                    }
                                }
                            })()}
                        </Stack>
                        {account ? (
                            <Stack direction="row" spacing={3} justifyContent="center">
                                <Button
                                    size="large"
                                    sx={{ minWidth: (theme) => theme.spacing(20) }}
                                    variant="outlined"
                                    disabled={activeStep === 0 || pendingTx}
                                    onClick={() => {
                                        setActiveStep((prevState) => prevState - 1);
                                    }}
                                >
                                    Back
                                </Button>
                                <LoadingButton
                                    size="large"
                                    loading={pendingTx}
                                    sx={{ minWidth: (theme) => theme.spacing(20) }}
                                    variant="contained"
                                    disabled={(() => {
                                        switch (activeStep) {
                                            case 0: {
                                                return presale.isWhitelist ? false : true;
                                            }
                                            case 1: {
                                                if (Number(presale.max) < Number(presale.min)) return true;
                                                if (Number(presale.hardcap) < Number(presale.softcap)) return true;
                                                return Number(presale.hardcap) > 0 &&
                                                    presale.softcap !== '' &&
                                                    Number(presale.softcap) >= 0 &&
                                                    Number(presale.max) > 0 &&
                                                    presale.min !== '' &&
                                                    Number(presale.min) >= 0
                                                    ? false
                                                    : true;
                                            }
                                            case 2: {
                                                return presale.start && presale.end > 0 && presale.price > 0
                                                    ? false
                                                    : true;
                                            }
                                        }
                                        return false;
                                    })()}
                                    onClick={() => {
                                        if (activeStep === 2) {
                                            createPresale();
                                        } else {
                                            setActiveStep((prevState) => prevState + 1);
                                        }
                                    }}
                                >
                                    {activeStep === 2 ? 'Create' : 'Continue'}
                                </LoadingButton>
                            </Stack>
                        ) : (
                            <Stack direction="row" spacing={3} justifyContent="center">
                                <Button
                                    size="large"
                                    sx={{ minWidth: (theme) => theme.spacing(20) }}
                                    variant="contained"
                                    onClick={onPresentConnectModal}
                                >
                                    Connect Wallet
                                </Button>
                            </Stack>
                        )}
                    </Stack>
                </CardContent>
                <Stack
                    padding={2}
                    bgcolor={'rgba(100, 100, 100, .1)'}
                    borderRadius={10}
                    position="absolute"
                    right={24}
                    bottom={24}
                >
                    <QuestionMarkRoundedIcon />
                </Stack>
            </Card>
        </Container>
    );
};

export default Create;
