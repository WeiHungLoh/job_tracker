import './ToggleButton.css'

const ToggleButton = ({ toggled, onToggle }) => {
    const buttonMessage = (toggled) => {
        return toggled ? 'Hide Archive Button' : 'Unhide Archive Button'
    }

    return (
        <div className='hide-archive-button'>
            <div>{buttonMessage(toggled)}</div>
            <button className={`toggle-button ${toggled ? 'active' : ''}`}
                onClick={onToggle}>
                <div className='thumb' />
            </button>
        </div>
    )
}

export default ToggleButton
