import tokens from './tokens';

export const SWAP_TOKENS = {
    tefi: [
        {
            ...tokens.bnb,
            id: 'bnb',
            icon: require('assets/img/bnb.png'),
            isBase: true,
            method: ['buy', 'sell']
        },
        {
            ...tokens.tefi,
            id: 'tefi',
            icon: require('assets/img/tefi.png'),
            isBase: false,
            method: ['buy', 'sell']
        },
        {
            ...tokens.busd,
            id: 'busd',
            icon: require('assets/img/busd.png'),
            isBase: false,
            method: ['buy']
        }
    ],
    dbt: [
        {
            ...tokens.bnb,
            id: 'bnb',
            icon: require('assets/img/bnb.png'),
            isBase: true,
            method: ['buy', 'sell']
        },
        {
            ...tokens.dbt,
            id: 'dbt',
            icon: require('assets/img/dbt.png'),
            isBase: false,
            method: ['buy', 'sell']
        }
    ],
    dfk: [
        {
            ...tokens.bnb,
            id: 'bnb',
            icon: require('assets/img/bnb.png'),
            isBase: true,
            method: ['buy', 'sell']
        },
        {
            ...tokens.dfk,
            id: 'dfk',
            icon: require('assets/img/dfk.jpg'),
            isBase: false,
            method: ['buy', 'sell']
        }
    ],
    rtt: [
        {
            ...tokens.bnb,
            id: 'bnb',
            icon: require('assets/img/bnb.png'),
            isBase: true,
            method: ['buy', 'sell']
        },
        {
            ...tokens.rtt,
            id: 'rtt',
            icon: require('assets/img/rtt.png'),
            isBase: false,
            method: ['buy', 'sell']
        }
    ],
    pumpn: [
        {
            ...tokens.bnb,
            id: 'bnb',
            icon: require('assets/img/bnb.png'),
            isBase: true,
            method: ['buy', 'sell']
        },
        {
            ...tokens.pumpn,
            id: 'pumpn',
            icon: require('assets/img/pumpn.png'),
            isBase: false,
            method: ['buy', 'sell']
        }
    ],
    webinu: [
        {
            ...tokens.bnb,
            id: 'bnb',
            icon: require('assets/img/bnb.png'),
            isBase: true,
            method: ['buy', 'sell']
        },
        {
            ...tokens.webinu,
            id: 'webinu',
            icon: require('assets/img/webinu.png'),
            isBase: false,
            method: ['buy', 'sell']
        }
    ]
};

export const SWAP_TYPES = [
    {
        id: 'tefi',
        icon: require('assets/img/tefi.png'),
        label: 'TRUE DEFI',
        description: 'True Defi Token Swap',
        dominator: 1000
    },
    {
        id: 'dbt',
        icon: require('assets/img/dbt.png'),
        label: 'DISCO BURN',
        description: 'Disco Burn Token Swap',
        dominator: 1000
    },
    {
        id: 'dfk',
        icon: require('assets/img/dfk.jpg'),
        label: 'DEFI KINGS',
        description: 'Defi Kings Token Swap',
        dominator: 10000
    },
    {
        id: 'rtt',
        icon: require('assets/img/rtt.png'),
        label: 'REBEL TRADERS',
        description: 'Rebel Traders Token Swap',
        dominator: 10000
    },
    {
        id: 'pumpn',
        icon: require('assets/img/pumpn.png'),
        label: 'PUMPIN GONUTS',
        description: 'Pumpin Gonuts Token Swap',
        dominator: 10000
    }
    // {
    //     id: 'webinu',
    //     icon: require('assets/img/webinu.png'),
    //     label: 'CHROME INU',
    //     description: 'Chrome Inu Token Swap',
    //     dominator: 10000
    // }
];
