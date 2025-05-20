const getLoggedInUser = (tokenPayload) => {
    return {
        email: tokenPayload.email || "",
        sub: tokenPayload.sub || "",
        name: tokenPayload.name || ""
    }
}

module.exports = {
    getLoggedInUser,
}