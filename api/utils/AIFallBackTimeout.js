function timeoutPromise(ms, fallbackValue) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(fallbackValue), ms);
  });
}

module.exports = {
    timeoutPromise
}