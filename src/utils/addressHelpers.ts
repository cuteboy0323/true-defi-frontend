import { CIDS } from 'config';
import { CHAIN_ID } from 'config/constants/networks';
import { Address } from 'config/constants/types';

import addresses from 'config/constants/contracts';

export const getAddress = (address: Address): string => {
    return address[CHAIN_ID] ? address[CHAIN_ID] : address[CIDS.MAINNET];
};
export const getRouterAddress = () => {
    return getAddress(addresses.router);
};
export const getDividendAddress = () => {
    return getAddress(addresses.dividend);
};
export const getMainTokenAddress = () => {
    return getAddress(addresses.token);
};
export const getSwapAddress = (active: string = 'tefi') => {
    return getAddress(addresses.swap[active]);
};
export const getPreSaleAddress = () => {
    return getAddress(addresses.psale);
};
export const getMulticallAddress = () => {
    return getAddress(addresses.multiCall);
};
export const getLotteryAddress = () => {
    return getAddress(addresses.lottery);
};
export const getLaunchpadAddress = () => {
    return getAddress(addresses.launchpad);
};
