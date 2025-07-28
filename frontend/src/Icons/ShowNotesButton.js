import './ShowNotesButton.css'

const ShowNotesButton = ({ toggled, onToggle }) => {
    const buttonMessage = (toggled) => {
        return toggled ? 'Hide Notes' : 'Unhide Notes'
    }

    return (
        <div className='hide-notes-button'>
            <div>{buttonMessage(toggled)}</div>
            <button className={`toggle-button ${toggled ? 'active' : ''}`}
                onClick={onToggle}>
                <div className='thumb' />
            </button>
        </div>
    )
}

export default ShowNotesButton
