/*
    Change @apiBaseUrl to local instances when in development
*/
export class ApplicationConfiguration {
    static appConfig = {
        authUrl: "",
        tokenInfo: "",
    }
    
    static apiBaseUrl = "http://30-seconds.af-south-1.elasticbeanstalk.com";

    static setAppConfig(appConfig) {
        ApplicationConfiguration.appConfig = { ...appConfig };
    }
}
