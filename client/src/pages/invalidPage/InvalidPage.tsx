import { routes } from '../../routes';
import styles from './InvalidPage.module.css';

const InvalidPage = () => {
    return (
        <div className={styles.invalidPage}>
            <h2>Page 404 not found</h2>
            <a href={routes.addApplication}>Click here to head to home page</a>
        </div>
    );
};

export default InvalidPage;
