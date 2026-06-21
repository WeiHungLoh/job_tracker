import FallbackScreen from '../../components/fallbackScreen/FallbackScreen';
import { routes } from '../../routes';
import { useNavigate } from 'react-router-dom';

const InvalidPage = () => {
    const navigate = useNavigate();

    return <FallbackScreen variant='notFound' onAction={() => navigate(routes.viewApplications)} />;
};

export default InvalidPage;
