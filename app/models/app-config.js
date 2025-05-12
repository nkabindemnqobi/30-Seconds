/*
    Change @apiBaseUrl to local instances when in development
*/
// export class ApplicationConfiguration {
//     static redirectUrl;
//     static apiBaseUrl = "http://30-seconds.af-south-1.elasticbeanstalk.com";
//     static loginUrl = "http://my-30-seconds.s3-website.af-south-1.amazonaws.com";

//     static setRedirectUrl(redirectUri) {
//         ApplicationConfiguration.redirectUrl = redirectUri;
//     }
// }

export class ApplicationConfiguration {
    static redirectUrl;
    static apiBaseUrl = "http://localhost:8000";
    static loginUrl = "http://localhost:3000";

    static setRedirectUrl(redirectUri) {
        ApplicationConfiguration.redirectUrl = redirectUri;
    }
}