import { useState } from 'react';
import applicationPreview from '../../../images/view-application.png';
import archivedApplicationPreview from '../../../images/view-archived-application.png';
import archivedInterviewPreview from '../../../images/view-archived-interview.png';
import dashboardPreview from '../../../images/dashboard.png';
import interviewPreview from '../../../images/view-interview.png';
import { routes } from '../../routes';
import styles from './AuthProductIntro.module.css';

const PRODUCT_HOST = 'jobtracker.weihungloh.com';

const productPreviews = [
    {
        alt: 'Job Tracker dashboard showing application and interview statistics',
        image: dashboardPreview,
        label: 'Dashboard',
        route: routes.dashboard,
    },
    {
        alt: 'Job Tracker application list showing applications, statuses, interviews and notes',
        image: applicationPreview,
        label: 'Applications',
        route: routes.viewApplications,
    },
    {
        alt: 'Job Tracker interview list showing scheduled job interviews',
        image: interviewPreview,
        label: 'Interviews',
        route: routes.viewInterviews,
    },
    {
        alt: 'Job Tracker archived application list',
        image: archivedApplicationPreview,
        label: 'Archived applications',
        route: routes.archivedApplications,
    },
    {
        alt: 'Job Tracker archived interview list',
        image: archivedInterviewPreview,
        label: 'Archived interviews',
        route: routes.archivedInterviews,
    },
] as const;

const ProductPreviewCarousel = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const activePreview = productPreviews[activeIndex];

    const showPreviousPreview = () => {
        setActiveIndex((currentIndex) => (currentIndex - 1 + productPreviews.length) % productPreviews.length);
    };

    const showNextPreview = () => {
        setActiveIndex((currentIndex) => (currentIndex + 1) % productPreviews.length);
    };

    return (
        <div
            className={styles.preview}
            role='region'
            aria-roledescription='carousel'
            aria-label='Job Tracker product preview'
        >
            <div className={styles.browserBar} aria-hidden='true'>
                <span />
                <span />
                <span />
                <div className={styles.browserAddress}>
                    {PRODUCT_HOST}
                    {activePreview.route}
                </div>
            </div>

            <button
                type='button'
                className={styles.previewImageButton}
                onClick={showNextPreview}
                aria-label={`Show the next preview. Currently showing ${activePreview.label}`}
            >
                <img src={activePreview.image} alt={activePreview.alt} />
            </button>

            <div className={styles.carouselControls}>
                <button type='button' className={styles.carouselArrow} onClick={showPreviousPreview}>
                    <span aria-hidden='true'>‹</span>
                    <span className={styles.visuallyHidden}>Previous preview</span>
                </button>

                <div className={styles.carouselDots} aria-label='Choose a product preview'>
                    {productPreviews.map((preview, index) => (
                        <button
                            key={preview.route}
                            type='button'
                            className={`${styles.carouselDot} ${index === activeIndex ? styles.activeCarouselDot : ''}`}
                            onClick={() => setActiveIndex(index)}
                            aria-label={`Show ${preview.label}`}
                            aria-current={index === activeIndex ? 'true' : undefined}
                        />
                    ))}
                </div>

                <button type='button' className={styles.carouselArrow} onClick={showNextPreview}>
                    <span aria-hidden='true'>›</span>
                    <span className={styles.visuallyHidden}>Next preview</span>
                </button>
            </div>
        </div>
    );
};

export default ProductPreviewCarousel;
