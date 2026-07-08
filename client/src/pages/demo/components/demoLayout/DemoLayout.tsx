import { DemoProvider } from '../../context/DemoContext';
import DemoLayoutContent from './DemoLayoutContent';

const DemoLayout = () => (
    <DemoProvider>
        <DemoLayoutContent />
    </DemoProvider>
);

export default DemoLayout;
