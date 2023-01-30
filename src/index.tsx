import App from './App';

import {
    Root,
    MuiThemeProvider,
    ConfigProvider,
    ToastsProvider,
    ModalProvider,
    Web3ReactProvider,
    APIProvider,
    StoreProvider
} from './providers';

Root.render(
    <ConfigProvider>
        <MuiThemeProvider>
            <APIProvider>
                <StoreProvider>
                    <Web3ReactProvider>
                        <ToastsProvider>
                            <ModalProvider>
                                <App />
                            </ModalProvider>
                        </ToastsProvider>
                    </Web3ReactProvider>
                </StoreProvider>
            </APIProvider>
        </MuiThemeProvider>
    </ConfigProvider>
);
