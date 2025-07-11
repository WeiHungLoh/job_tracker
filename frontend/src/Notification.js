const Notification = ({message}) => {
    if (!message) {
        return null
    }

    return (
        <div data-testid='noti' className="notification" style={{
            backgroundColor: message.type === 'error' ? 'red' : 'green'}}>
            {message.message}
        </div>
    )
}

export default Notification
