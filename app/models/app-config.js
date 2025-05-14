/*
    Change @apiBaseUrl to local instances when in development
*/
export class ApplicationConfiguration {
    static appConfig = {
        authUrl: "",
        tokenInfo: "",
    }
    
    static apiBaseUrl = "http://localhost:8000";
    static loginUrl = "http://localhost:3000";

    static setAppConfig(appConfig) {
        ApplicationConfiguration.appConfig = { ...appConfig };
    }
}
