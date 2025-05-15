/*
    Change @apiBaseUrl to local instances when in development
*/
export class ApplicationConfiguration {
    static appConfig = {
        authUrl: "",
        tokenInfo: "",
    }
    
    static apiBaseUrl = "http://db-30-seconds.cywd7qphawxe.af-south-1.rds.amazonaws.com";

    static setAppConfig(appConfig) {
        ApplicationConfiguration.appConfig = { ...appConfig };
    }
}
