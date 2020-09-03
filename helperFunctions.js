const QuickEncrypt = require('quick-encrypt');

// V A L I D A T E   U S E R   U R L S ////////////////////
const validateURL = (url) => (url.match(/^(https:\/\/|http:\/\/)/) ? url : `https://${url}`);

// G E N   A   R A N D O M   5   C H A R   S T R I N G ////
const genRandomString = () => Math.random().toString(36).substring(3).slice(-5);

// F I X   S T U P I D   D A T E   O B J E C T S //////////
const dateParser = (date) => {
  const d = new Date(date);
  return `${d.getUTCDay()}
  /${d.getMonth()}
  /${d.getFullYear()}
  /${d.getHours()}
  :${d.getMinutes()}
  :${(`0${d.getSeconds()}`).slice(-2)}`.replace(/\s/g, '');
};

// H A S H   A   P A S S W O R D //////////////////////////
const hashPass = (str, publicKey) => QuickEncrypt.encrypt(str, publicKey);

// Y E E T   O U R   M O D U L E S   T O   E X P R E S S //
module.exports = {
  validateURL, genRandomString, dateParser, hashPass,
};
