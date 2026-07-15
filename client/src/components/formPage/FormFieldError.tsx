import styles from './FormPage.module.css';

type FormFieldErrorProps = {
    id: string;
    message?: string;
};

const FormFieldError = ({ id, message }: FormFieldErrorProps) => {
    if (!message) {
        return null;
    }

    return (
        <p className={styles.fieldError} id={id} role='alert'>
            {message}
        </p>
    );
};

export default FormFieldError;
