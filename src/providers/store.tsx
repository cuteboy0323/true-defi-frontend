import { useState } from 'react';
import { StoreContext } from 'contexts/store';

type StoreProviderProps = {
    children: React.ReactNode;
};

const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
    const [pools, setPools] = useState<any>({});

    return <StoreContext.Provider value={{ pools, setPools }}>{children}</StoreContext.Provider>;
};

export default StoreProvider;
