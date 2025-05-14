export const getCredentials = () => {
    return sessionStorage.getItem('idToken');
}