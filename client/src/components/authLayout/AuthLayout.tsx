import type { AuthLayoutProps } from './models';
import styles from './AuthLayout.module.css';

const AuthLayout = ({ children }: AuthLayoutProps) => {
    return <main className={styles.authPage}>{children}</main>;
};

export default AuthLayout;
