const express = require("express");
const app = express();
const PORT = process.env.TINYAPP_PORT || 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const {
  getIdFromEmail,
  generateRandomString,
  urlsMadeByUser,
  isLoggedIn,
  getVisitSummary,
  getUniqueVisitors,
  displayError,
  fixUrl
} = require('./helpers');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// req.session.user_id will be set upon login/registration
// req.session.visitor_id is set for everyone once they visit a shortURL, for analytics
app.use(cookieSession({
  name: 'session',
  keys: ['secret', 'moresecret', 'evenmore'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(methodOverride('_method'));

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
    visits: []
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
    visits: []
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "a@a.com",
    hashedPassword: bcrypt.hashSync("purple", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "b@b.com",
    hashedPassword: bcrypt.hashSync("dishwasher", 10)
  }
};

app.get("/", (req, res) => {
  if (!isLoggedIn(req.session, users)) {
    return res.redirect("login");
  }
  return res.redirect("urls");
});

app.get("/urls.json", (req, res) => {
  return res.json(urlDatabase);
});

// Displays analytics for user's own shortURL creations
app.get("/urls", (req, res) => {
  if (!isLoggedIn(req.session, users)) {
    return displayError(res, 401, "You must be logged in for that!", null);
  }

  const user = users[req.session.user_id];
  const urls = urlsMadeByUser(user.id, urlDatabase);

  // Calculate unique visitors for each url
  for (const url in urls) {
    {
      urls[url].uniqueVisitors = getUniqueVisitors(urls[url].visits);
    }
  }

  let templateVars = { urls, user };
  return res.render("urls_index", templateVars);
});

// Create a new shortURL
app.get("/urls/new", (req, res) => {
  if (!isLoggedIn(req.session, users)) {
    return res.redirect("../login");
  } else {
    return res.render("urls_new", { user: users[(req.session.user_id)] });
  }
});

// Details/edit page for existing shortURL
app.get("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const url = urlDatabase[shortURL];

  // Check if url exists
  if (!url) {
    return displayError(res, 404, "URL does not exist!", users[(req.session.user_id)]);
  }

  // Check if user is owner of url
  if (url.userID !== req.session.user_id) {
    return displayError(res, 401, "You cannot do that!", users[(req.session.user_id)]);
  }
  let templateVars = { shortURL, url, user: users[(req.session.user_id)] };
  return res.render("urls_show", templateVars);
});

// Adding a new URL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();

  // Making sure no collisions in shortURL generation
  while (urlDatabase[shortURL]) {
    shortURL = generateRandomString();
  }
  urlDatabase[shortURL] = {
    longURL: fixUrl(req.body.longURL),
    userID: req.session.user_id,
    visits: []
  };
  return res.redirect(`urls/${shortURL}`);
});

// Redirects a shortURL to its longURL
app.get("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  if (!urlDatabase[shortURL]) {
    return displayError(res, 404, "ShortURL not found!", users[req.session.user_id]);
  }

  // Give a tracking cookie to determine unique visitors
  if (!req.session.visitor_id) {
    req.session.visitor_id = generateRandomString();
  }

  // Add this visit to shortURL's visits array with visitor_id and timestamp
  const visit = {
    visitor: req.session.visitor_id,
    time: new Date(Date.now()),
  };
  urlDatabase[shortURL].visits.push(visit);

  const { longURL } = urlDatabase[shortURL];
  return res.redirect(longURL);
});

app.put("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const { newLongURL } = req.body;
  urlDatabase[shortURL].longURL = fixUrl(newLongURL);
  return res.redirect("..");
});

app.delete("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;
  if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userID) {
    delete urlDatabase[shortURL];
    return res.redirect("..");
  } else {
    return displayError(res, 401, "Operation failed", users[req.session.user_id]);
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  return res.redirect("login");
});

app.get("/register", (req, res) => {
  // Redirect to home if a logged-in user tries to register
  if (isLoggedIn(req.session, users)) {
    return res.redirect('/urls');
  }
  return res.render("register", { user: users[req.session.user_id] });
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return displayError(res, 400, "You did not fill out the form correctly!", null);
  } else if (getIdFromEmail(email, users)) {
    return displayError(res, 400, "Email already in use!", null);
  }

  // Collision handling during userID generation
  const id = generateRandomString();
  while (users[id]) {
    id = generateRandomString();
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = { id, email, hashedPassword };
  users[id] = newUser;
  req.session.user_id = id;
  return res.redirect("urls");
});

app.get("/login", (req, res) => {
  // Redirect to home if a logged-in user tries to login
  if (isLoggedIn(req.session, users)) {
    return res.redirect('/urls');
  }
  return res.render("login", { user: users[req.session.user_id] });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const id = getIdFromEmail(email, users);

  if (!id) {
    return displayError(res, 403, "Login failed", null);
  } else if (bcrypt.compareSync(password, users[id].hashedPassword) === false) {
    return displayError(res, 403, "Login failed", null);
  } else {
    req.session.user_id = id;
    return res.redirect("urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

