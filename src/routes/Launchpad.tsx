import { lazy } from 'react';

// project imports
import Layout from 'layouts';
import Loadable from 'components/Loadable';

import { Navigate } from 'react-router-dom';

const Create = Loadable(lazy(() => import('pages/Launchpad/Create')));
const List = Loadable(lazy(() => import('pages/Launchpad/List')));
const View = Loadable(lazy(() => import('pages/Launchpad/View')));
const Manage = Loadable(lazy(() => import('pages/Launchpad/Manage')));

const MainRoutes = {
    path: '/launchpad',
    element: <Layout />,
    children: [
        {
            path: '',
            element: <Navigate to="list" />
        },
        {
            path: 'create',
            element: <Create />
        },
        {
            path: 'list',
            element: <List />
        },
        {
            path: 'view/:address',
            element: <View />
        },
        {
            path: 'manage/:address',
            element: <Manage />
        }
    ]
};

export default MainRoutes;
