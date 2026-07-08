import { scrollAndHighlight } from '../../../helper/highlightElement';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type UseDemoHashHighlightOptions = {
    disabled?: boolean;
    highlightClass: string;
    timeouts: Record<string, ReturnType<typeof setTimeout>>;
    visibleIds: string[];
};

export const useDemoHashHighlight = ({
    disabled = false,
    highlightClass,
    timeouts,
    visibleIds,
}: UseDemoHashHighlightOptions) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [pendingHighlightId, setPendingHighlightId] = useState<string | null>(null);

    useEffect(() => {
        const targetId = location.hash.substring(1);
        if (disabled || !targetId || !visibleIds.includes(targetId)) {
            return;
        }

        setPendingHighlightId(targetId);
        navigate(location.pathname, { replace: true });
    }, [disabled, location.hash, location.pathname, navigate, visibleIds]);

    useEffect(() => {
        if (disabled || !pendingHighlightId || !visibleIds.includes(pendingHighlightId)) {
            return;
        }

        scrollAndHighlight(pendingHighlightId, highlightClass, timeouts);
        setPendingHighlightId(null);
    }, [disabled, highlightClass, pendingHighlightId, timeouts, visibleIds]);
};
