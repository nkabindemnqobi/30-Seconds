export const getApplicationConfiguration = async (applicationConfiguration) => {
    try {
        const redirectUrlPromise = await fetch(`${applicationConfiguration.apiBaseUrl}/auth/login`);
        const redirectUrl = await redirectUrlPromise.json();
        applicationConfiguration["redirectUrl"] = redirectUrl.authUrl ? redirectUrl.authUrl : "";
        return applicationConfiguration;
    } catch(error) {
        return error;
    }   
}