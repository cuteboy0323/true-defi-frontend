import { lazy } from 'react';

// project imports
import Layout from 'layouts';
import Loadable from 'components/Loadable';

const Dashboard = Loadable(lazy(() => import('pages/Dashboard')));
const Swap = Loadable(lazy(() => import('pages/Swap')));
const Airdrop = Loadable(lazy(() => import('pages/Airdrop')));
const PreSale = Loadable(lazy(() => import('pages/PreSale')));
const Lottery = Loadable(lazy(() => import('pages/Lottery')));

const MainRoutes = {
    path: '/',
    element: <Layout />,
    children: [
        {
            path: '/dashboard',
            element: <Dashboard />
        },
        {
            path: '/swap',
            element: <Swap />
        },
        {
            path: '/airdrop',
            element: <Airdrop />
        },
        {
            path: '/pre-sale',
            element: <PreSale />
        },
        {
            path: '/lottery',
            element: <Lottery />
        }
    ]
};

export default MainRoutes;
