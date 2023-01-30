// ** React Methods ** //
import { useEffect, useMemo, useState } from 'react';

// ** Material UI Components ** //
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import Select, { SelectChangeEvent } from '@mui/material/Select';

// ** Material UI Icons ** //
import AddRoundedIcon from '@mui/icons-material/AddRounded';

import { useNavigate } from 'react-router-dom';
import { useLaunchpadContract } from 'hooks/useContract';

import PresaleItem, { GetPoolsData } from './Item';

import { ethersToBigNumber } from 'utils/bigNumber';

const PER_PAGE = 6;

const List = () => {
    const navigate = useNavigate();

    const [filter, setFilter] = useState<string>('all');
    const [sort, setSort] = useState<string>('all');
    const [search, setSearch] = useState<string>('');
    const [pools, setPools] = useState<any>({});
    const [page, setPage] = useState<number>(1);

    const [list, setList] = useState<any>({});

    const handleFilterChange = (event: SelectChangeEvent) => {
        setPage(1);
        setFilter(event.target.value);
    };
    const handleSortChange = (event: SelectChangeEvent) => {
        setSort(event.target.value);
    };
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(1);
        setSearch(event.target.value);
    };
    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => setPage(value);

    const launchpadContract = useLaunchpadContract();

    const poolList = useMemo(() => {
        let data = Object.entries(list);
        const cTime = Math.floor(new Date().getTime() / 1000);
        data = Object.entries(pools).filter((item: any) => {
            const poolData = item[1];
            if (!search && search === '') return true;
            return poolData?.token?.name?.includes(search) || poolData?.token?.symbol?.includes(search);
        });
        switch (filter) {
            case 'upcoming': {
                data = data.filter((item: any) => {
                    const { status } = item[1];
                    const isStarted = status.startTime < cTime;
                    return isStarted ? false : true;
                });
                break;
            }
            case 'inprogress': {
                data = data.filter((item: any) => {
                    const { status } = item[1];
                    const isStarted = status.startTime < cTime;
                    const isEnded = status.endTime < cTime;
                    return isStarted && !isEnded ? true : false;
                });
                break;
            }
            case 'filled': {
                data = data.filter((item: any) => {
                    const { status } = item[1];
                    const raised = ethersToBigNumber(status.raised);
                    const hardcap = ethersToBigNumber(status.hardcap);
                    const isFilled = raised.isGreaterThanOrEqualTo(hardcap);
                    return isFilled ? true : false;
                });
                break;
            }
            case 'ended': {
                data = data.filter((item: any) => {
                    const { status } = item[1];
                    const isEnded = status.endTime < cTime;
                    return isEnded ? true : false;
                });
                break;
            }
            case 'canceled': {
                data = data.filter((item: any) => {
                    const { status } = item[1];
                    return status.canceled;
                });
                break;
            }
        }
        switch (sort) {
            case 'hardcap': {
                data = data.sort((a: any, b: any) => {
                    const hardcap1 = ethersToBigNumber(a[1]?.status?.hardcap).toNumber();
                    const hardcap2 = ethersToBigNumber(b[1]?.status?.hardcap).toNumber();
                    return hardcap2 - hardcap1;
                });
                break;
            }
            case 'softcap': {
                data = data.sort((a: any, b: any) => {
                    const softcap1 = ethersToBigNumber(a[1]?.status?.softcap).toNumber();
                    const softcap2 = ethersToBigNumber(b[1]?.status?.softcap).toNumber();
                    return softcap2 - softcap1;
                });
                break;
            }
            case 'starttime': {
                data = data.sort((a: any, b: any) => {
                    const startTime1 = ethersToBigNumber(a[1]?.status?.startTime).toNumber();
                    const startTime2 = ethersToBigNumber(b[1]?.status?.startTime).toNumber();
                    return startTime2 - startTime1;
                });
                break;
            }
            case 'endtime': {
                data = data.sort((a: any, b: any) => {
                    const startTime1 = ethersToBigNumber(a[1]?.status?.startTime).toNumber();
                    const startTime2 = ethersToBigNumber(b[1]?.status?.startTime).toNumber();
                    return startTime2 - startTime1;
                });
                break;
            }
        }
        return data.map((item) => item[0]);
    }, [list, search, pools, filter, sort]);

    const pageData = useMemo(() => {
        const filtered = poolList.filter((item: any, index: number) => {
            return index >= (page - 1) * PER_PAGE && index < page * PER_PAGE;
        });
        return filtered;
    }, [poolList, page]);

    const addPools = (address: string, data: any) => {
        if (!Object.values(data.status).length || !Object.values(data.token).length) return;
        setPools((prevState) => ({
            ...prevState,
            [address]: {
                ...data
            }
        }));
    };

    const update = () => {
        launchpadContract.getPools('0x0000000000000000000000000000000000000000').then((result: any) => {
            result.forEach((element: any, index: number) => {
                setList((prevState: any) => ({
                    ...prevState,
                    [element]: {}
                }));
            });
        });
    };
    useEffect(() => {
        update();
    }, []);

    return (
        <Container sx={{ py: 4 }}>
            <Card variant="outlined" component={Stack} direction="row" spacing={2} p={2} mb={2}>
                <TextField
                    size="small"
                    sx={{ flexGrow: 1 }}
                    variant="outlined"
                    value={search}
                    onChange={handleSearchChange}
                    inputProps={{ placeholder: 'Enter token name or token symbol' }}
                />
                <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                    <InputLabel id="filter-by">Filter By</InputLabel>
                    <Select
                        labelId="filter-by"
                        id="filter-by"
                        value={filter}
                        label="Filter By"
                        onChange={handleFilterChange}
                    >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="upcoming">Upcoming</MenuItem>
                        <MenuItem value="inprogress">Inprogress</MenuItem>
                        <MenuItem value="filled">Filled</MenuItem>
                        <MenuItem value="ended">Ended</MenuItem>
                        <MenuItem value="canceled">Canceled</MenuItem>
                    </Select>
                </FormControl>
                <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                    <InputLabel id="sort-by">Sort By</InputLabel>
                    <Select labelId="sort-by" id="sort-by" value={sort} label="Sorty By" onChange={handleSortChange}>
                        <MenuItem value="all">No Filter</MenuItem>
                        <MenuItem value="hardcap">Hard Cap</MenuItem>
                        <MenuItem value="softcap">Soft Cap</MenuItem>
                        <MenuItem value="starttime">Start Time</MenuItem>
                        <MenuItem value="endtime">End Time</MenuItem>
                    </Select>
                </FormControl>
                <Button
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    onClick={() => navigate('/launchpad/create')}
                >
                    Create Presale
                </Button>
            </Card>
            <Grid container spacing={2}>
                {Object.keys(list).map((item: string) => (
                    <GetPoolsData addPools={addPools} item={item} key={item} />
                ))}
                {!pageData.length && (
                    <Stack
                        spacing={2}
                        justifyContent="center"
                        alignItems="center"
                        sx={{
                            width: '100%',
                            height: 400,
                            zIndex: 10,
                            backdropFilter: 'blur(5px)'
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
                {pageData.map((item: string) => (
                    <PresaleItem
                        key={item}
                        update={update}
                        item={item}
                        status={pools[item].status}
                        token={pools[item].token}
                    />
                ))}
                {pageData.length > 0 && (
                    <Grid item xs={12}>
                        <Stack alignItems="flex-end">
                            <Pagination
                                count={poolList?.length ? Math.ceil(poolList?.length / PER_PAGE) : 0}
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
                    </Grid>
                )}
            </Grid>
        </Container>
    );
};

export default List;
