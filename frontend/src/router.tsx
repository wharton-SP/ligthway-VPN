import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./pages/MainLayout";
import PeersLayout from "./pages/peers/PeersLayout";
import LogsLayout from "./pages/logs/LogsLayout";


const router = createBrowserRouter([
    {
        path:'/',
        element : <MainLayout />,
        children: [
            {
                path: '',
                element: <PeersLayout />
            },
            {
                path: 'logs',
                element: <LogsLayout />
            } 
        ]
    }
])

export default router