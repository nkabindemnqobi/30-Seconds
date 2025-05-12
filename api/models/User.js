class User {
    setUser(authorizedUser) {
        const { email, sub, name } = authorizedUser;
        User.user = { email, sub, name };
    }

    getUser() {
        return User.user;
    }
}

module.exports = {
    User,
}