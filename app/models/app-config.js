/*
    Change @apiBaseUrl to local instances when in development
*/
export class ApplicationConfiguration {
    static appConfig = {
        authUrl: "",
        tokenInfo: "",
    }
    
    static apiBaseUrl = "https://d21ni8tqdlfkze.cloudfront.net";

    static setAppConfig(appConfig) {
        ApplicationConfiguration.appConfig = { ...appConfig };
    }
}
