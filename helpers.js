const getIdFromEmail = function(email, userDB) {
  for (const key in userDB) {
    if (userDB[key].email === email) {
      return key;
    }
  }
  return undefined;
};

module.exports = { getIdFromEmail }