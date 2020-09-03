const QuickEncrypt = require('quick-encrypt');

const validateURL = (url) => (url.match(/^(https:\/\/|http:\/\/)/) ? url : `https://${url}`);
const genRandomString = () => Math.random().toString(36).substring(3).slice(-4);
const dateParser = (date) => {
  const d = new Date(date);
  return `${d.getUTCDay()}
  /${d.getMonth()}
  /${d.getFullYear()}
  /${d.getHours()}
  :${d.getMinutes()}
  :${(`0${d.getSeconds()}`).slice(-2)}`.replace(/\s/g, '');
};

const hashPass = (str, publicKey) => QuickEncrypt.encrypt(str, publicKey);

module.exports = {
  validateURL, genRandomString, dateParser, hashPass,
};
