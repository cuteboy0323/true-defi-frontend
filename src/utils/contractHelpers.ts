import type { Signer } from '@ethersproject/abstract-signer';
import type { Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { simpleRpcProvider } from 'utils/providers';

// Addresses
import {
    getRouterAddress,
    getDividendAddress,
    getMainTokenAddress,
    getSwapAddress,
    getPreSaleAddress,
    getMulticallAddress,
    getLotteryAddress,
    getLaunchpadAddress
} from 'utils/addressHelpers';

// ABI
import token from 'config/abi/token.json';
import router from 'config/abi/pkrouter.json';
import dividend from 'config/abi/dividend.json';
import presale from 'config/abi/psale.json';
import multicall from 'config/abi/multicall.json';
import lottery from 'config/abi/lottery.json';
import launchpad from 'config/abi/launchpad.json';

export const getContract = (abi: any, address: string, signer?: Signer | Provider) => {
    const signerOrProvider = signer ?? simpleRpcProvider;
    return new Contract(address, abi, signerOrProvider);
};

export const getRouterContract = (signer?: Signer | Provider) => {
    return getContract(router, getRouterAddress(), signer);
};
export const getDividendContract = (signer?: Signer | Provider) => {
    return getContract(dividend, getDividendAddress(), signer);
};
export const getMainTokenContract = (signer?: Signer | Provider) => {
    return getContract(token, getMainTokenAddress(), signer);
};
export const getSwapContract = (active: string, signer?: Signer | Provider) => {
    return getContract(require(`config/abi/swap/${active}.json`), getSwapAddress(active), signer);
};
export const getPreSaleContract = (signer?: Signer | Provider) => {
    return getContract(presale, getPreSaleAddress(), signer);
};
export const getMulticallContract = (signer?: Signer | Provider) => {
    return getContract(multicall, getMulticallAddress(), signer);
};
export const getLotteryContract = (signer?: Signer | Provider) => {
    return getContract(lottery, getLotteryAddress(), signer);
};
export const getLaunchpadContract = (signer?: Signer | Provider) => {
    return getContract(launchpad, getLaunchpadAddress(), signer);
};
