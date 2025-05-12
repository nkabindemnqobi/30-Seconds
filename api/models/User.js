class User {
    setUser(authenticatedUser) {
        const { email, sub, name } = authenticatedUser;
        User.user = { email, sub, name };
    }

    getUser() {
        return User.user;
    }
}

module.exports = {
    User,
}