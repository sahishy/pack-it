const getInitials = (profile) => {
    const firstInitial = profile?.firstName?.[0]?.toUpperCase() ?? ''
    const lastInitial = profile?.lastName?.[0]?.toUpperCase() ?? ''

    return (firstInitial + lastInitial) || 'U'
}

export {
    getInitials,
}