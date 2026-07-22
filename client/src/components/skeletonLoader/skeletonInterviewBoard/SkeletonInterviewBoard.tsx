import SkeletonCard from '../skeletonCard/SkeletonCard';
import styles from './SkeletonInterviewBoard.module.css';

const SKELETON_INTERVIEW_COUNT = 4;

const SkeletonInterviewBoard = () => (
    <div aria-busy='true' aria-label='Loading interviews' className={styles.board} role='status'>
        {Array.from({ length: SKELETON_INTERVIEW_COUNT }, (_, index) => (
            <SkeletonCard announceLoading={false} key={index} layout='board' variant='interview' />
        ))}
    </div>
);

export default SkeletonInterviewBoard;
