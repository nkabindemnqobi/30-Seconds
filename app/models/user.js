export class User {
    static user = {
        email: "",
        idToken: "",
        googleId: "",
        userName: ""
    };
    
    static setUser(userInfo) {
        User.user = { ...userInfo };
    }
}