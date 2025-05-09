export class Token {
    static token;
    
    static setUserToken(idToken) {
        Token.token = idToken;
    }
}