module.exports = {
  server: "CLIVEMM\\SQLEXPRESS",
  database: "web_dev_30_seconds_db",
  options: {
    trustedConnection: true, // Set to true if using Windows Authentication
    trustServerCertificate: true, // Set to true if using self-signed certificates
  },
  driver: "msnodesqlv8", // Required if using Windows Authentication
};
