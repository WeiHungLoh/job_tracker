export const unauthorizedResponseEvent = 'jobTrackerUnauthorizedResponse';

export const notifyUnauthorizedResponse = () => {
    window.dispatchEvent(new Event(unauthorizedResponseEvent));
};
