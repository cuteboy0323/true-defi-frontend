import { CIDS } from 'config';
import { Token } from 'types/token';
import { CHAIN_ID } from './networks';

const { MAINNET, TESTNET } = CIDS;

interface TokenList {
    [symbol: string]: Token;
}

const defineTokens = <T extends TokenList>(t: T) => t;

export const mainnetTokens = defineTokens({
    wbnb: {
        chainId: MAINNET,
        address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        decimals: 18,
        symbol: 'WBNB',
        name: 'Wrapped BNB',
        apiId: 'binancecoin',
        projectLink: 'https://www.binance.com/'
    },
    bnb: {
        chainId: MAINNET,
        address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        decimals: 18,
        symbol: 'BNB',
        name: 'BNB',
        apiId: 'binancecoin',
        projectLink: 'https://www.binance.com/'
    },
    tefi: {
        chainId: MAINNET,
        address: '0xD23a8017B014cB3C461a80D1ED9EC8164c3f7A77',
        decimals: 5,
        symbol: 'TEFI',
        name: 'TRUE DEFI',
        apiId: '',
        projectLink: 'https://truedefi.io/'
    },
    busd: {
        chainId: MAINNET,
        address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
        decimals: 18,
        symbol: 'BUSD',
        name: 'Binance USD',
        apiId: 'binance-usd',
        projectLink: 'https://www.paxos.com/busd/'
    },
    dbt: {
        chainId: MAINNET,
        address: '0x4A251d4fDcbbbc0A3d6Aa44F14B96480C4933C9C',
        decimals: 9,
        symbol: 'DBT',
        name: 'Disco Burn Token',
        apiId: 'disco-burn-token',
        projectLink: 'https://discoburntoken.com/'
    },
    dfk: {
        chainId: MAINNET,
        address: '0x8956692426786F16CF96922181553ef2d308de5C',
        decimals: 9,
        symbol: 'DFK',
        name: 'Defi Kings',
        apiId: '',
        projectLink: 'https://www.defikings.io/'
    },
    rtt: {
        chainId: MAINNET,
        address: '0x0834605689faae41708607a2761cd063775038e5',
        decimals: 9,
        symbol: 'RTT',
        name: 'RebelTraderToken',
        apiId: 'rebeltradertoken',
        projectLink: 'http://www.rebel-traders.com/'
    },
    pumpn: {
        chainId: MAINNET,
        address: '0x3B87Fa66d15FeC22c5129303FA057Ab20C13fC3a',
        decimals: 9,
        symbol: 'PUMPN',
        name: 'Pumpin Gonuts',
        apiId: '',
        projectLink: ''
    },
    webinu: {
        chainId: MAINNET,
        address: '0xF0839117Ea43F827c59405Ca825cA06B36aA2e40',
        decimals: 9,
        symbol: 'WEBINU',
        name: 'Chrome Inu',
        apiId: '',
        projectLink: ''
    }
} as const);

export const testnetTokens = defineTokens({
    wbnb: {
        chainId: TESTNET,
        address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
        decimals: 18,
        symbol: 'WBNB',
        name: 'Wrapped BNB',
        projectLink: 'https://www.binance.com/'
    },
    bnb: {
        chainId: TESTNET,
        address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
        decimals: 18,
        symbol: 'BNB',
        name: 'BNB',
        projectLink: 'https://www.binance.com/'
    },
    tefi: {
        chainId: TESTNET,
        address: '0x2360622D4Dbbbd32a58D99FC9CA86d26Ff341c16',
        decimals: 5,
        symbol: 'TEFI',
        name: 'TRUE DEFI',
        projectLink: 'https://truedefi.io/'
    },
    busd: {
        chainId: TESTNET,
        address: '0x228CB512d18DA79e49dD378aF9722fa76a605cE3',
        decimals: 18,
        symbol: 'BUSD',
        name: 'Binance USD',
        projectLink: 'https://www.paxos.com/busd/'
    }
} as const);

const tokens = () => {
    const chainId = CHAIN_ID;

    // If testnet - return list comprised of testnetTokens wherever they exist, and mainnetTokens where they don't
    if (parseInt(chainId, 10) === TESTNET) {
        return Object.keys(mainnetTokens).reduce((accum, key) => {
            return {
                ...accum,
                [key]: testnetTokens[key] || mainnetTokens[key]
            };
        }, {} as typeof testnetTokens & typeof mainnetTokens);
    }

    return mainnetTokens;
};

const unserializedTokens = tokens();
export default unserializedTokens;
