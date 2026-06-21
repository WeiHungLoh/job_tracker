import { ConfirmProvider } from 'material-ui-confirm';
import Navbar from '../navbar/Navbar';
import { Outlet } from 'react-router-dom';

const ProtectedLayout = () => (
    <>
        <Navbar />
        <ConfirmProvider>
            <Outlet />
        </ConfirmProvider>
    </>
);

export default ProtectedLayout;
