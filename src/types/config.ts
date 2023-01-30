export type EnvProps = {
    development: any;
    production: any;
    test: any;
};

export type ConfigProps = {
    isDark?: boolean;
    isChart?: boolean;
    activeSwap?: string;
    env: EnvProps;
};
