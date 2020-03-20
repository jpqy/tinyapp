const getIdFromEmail = function(email, userDB) {
  for (const key in userDB) {
    if (userDB[key].email === email) {
      return key;
    }
  }
  return undefined;
};

// For userID
const generateRandomString = () => {
  let string = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charLength = chars.length;

  for (let i = 0; i < 6; i++) {
    string += chars.charAt(Math.floor(Math.random() * charLength));
  }
  return string;
};

// Filters urlDatabase to only those with id of current user
const urlsMadeByUser = (userID, urlDatabase) => {
  const result = {};
  for (key in urlDatabase) {
    if (urlDatabase[key].userID === userID) {
      result[key] = urlDatabase[key];
    }
  }
  return result;
};

const isLoggedIn = (session, userDB) => {
  return Boolean(userDB[session.user_id]);
};

// Tallies array of {visitor, timestamp} objects
// Returns object with visitor as keys and how many times they visited as values
const getVisitSummary = (visits) => {
  const visitSummary = {};
  for (visit of visits) {
    if (!visitSummary[visit.visitor]) {
      visitSummary[visit.visitor] = 1;
    } else {
      visitSummary[visit.visitor]++;
    }
  }
  return visitSummary;
};

const getUniqueVisitors = (visits) => {
  return Object.keys(getVisitSummary(visits)).length;
};

const displayError = (res, errorCode, errorMessage, user) => {
  return res.status(errorCode).render("error",
    { user, errorCode, errorMessage });
};

// Appends http:// in front of url
const fixUrl = (url) => {
  if (!url.startsWith('http://')) {
    return `http://${url}`;
  }
  return url;
};
module.exports = {
  getIdFromEmail,
  generateRandomString,
  urlsMadeByUser,
  isLoggedIn,
  getVisitSummary,
  getUniqueVisitors,
  displayError,
  fixUrl
};