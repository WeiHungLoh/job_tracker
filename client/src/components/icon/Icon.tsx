import type { IconName, IconProps } from './models'
import { IoEye, IoNewspaperOutline } from 'react-icons/io5'
import { IoMdArchive, IoMdEyeOff } from 'react-icons/io'
import { MdEmail, MdLock } from 'react-icons/md'
import { FaBriefcase } from 'react-icons/fa'
import { GoAlertFill } from 'react-icons/go'
import type { IconType } from 'react-icons'

const icons: Record<IconName, IconType> = {
    activeApplications: IoNewspaperOutline,
    alert: GoAlertFill,
    archive: IoMdArchive,
    briefcase: FaBriefcase,
    email: MdEmail,
    lock: MdLock,
    visibility: IoEye,
    visibilityOff: IoMdEyeOff,
}

const Icon = ({ name, size, title, ...props }: IconProps) => {
    const IconComponent = icons[name]
    return <IconComponent aria-hidden={title ? undefined : true} size={size} title={title} {...props} />
}

export default Icon
