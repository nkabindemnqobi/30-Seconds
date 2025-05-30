const crypto = require("crypto");

const generateSessionId = () => {
    const bytes = new Uint8Array(32);
    crypto.webcrypto.getRandomValues(bytes);

    let base64 = Buffer.from(bytes).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

module.exports = {
    generateSessionId,
}
