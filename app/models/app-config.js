/*
    Change @apiBaseUrl to local instances when in development
*/
export class ApplicationConfiguration {
    static appConfig = {
        authUrl: "",
        tokenInfo: "",
    }
    
    static apiBaseUrl = "http://localhost:3002";

    static setAppConfig(appConfig) {
        ApplicationConfiguration.appConfig = { ...appConfig };
    }
}
