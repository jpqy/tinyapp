const express = require("express");
const app = express();
const PORT = 35353; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const { getIdFromEmail, generateRandomString, urlsForUser } = require('./helpers');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['user_id']
}));
app.use(methodOverride('_method'));

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
    totalVisits: 109,
    uniqueVisits: 24,
    visits: []
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
    totalVisitors: 0,
    uniqueVisitors: 0,
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
    password: "dishwasher"
  }
};

app.get("/", (req, res) => {
  return res.redirect("urls");
});

app.get("/urls.json", (req, res) => {
  return res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    return res.redirect("login");
  }
  const urls = urlsForUser(user.id, urlDatabase);
  let templateVars = { urls, user };
  console.log(urls);
  return res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("../login");
  } else {
    return res.render("urls_new", { user: users[(req.session.user_id)] });
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const { longURL } = urlDatabase[shortURL];
  let templateVars = { shortURL, longURL, user: users[(req.session.user_id)] };
  return res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();

  // Making sure no collisions in shortURL generation
  while (urlDatabase[shortURL]) {
    shortURL = generateRandomString();
  }
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
    totalVisits: 0,
    uniqueVisits: 0,
    visits: []
  };
  return res.redirect(`urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send("ShortURL not found!");
  }
  const { longURL } = urlDatabase[req.params.shortURL];
  return res.redirect(longURL);
});

app.put("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.newLongURL;
  urlDatabase[shortURL].longURL = newLongURL;
  return res.redirect("..");
});

app.delete("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;
  if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userID) {
    delete urlDatabase[shortURL];
    return res.redirect("..");
  } else {
    return res.status(401).send("Operation failed");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  return res.redirect("urls");
});

app.get("/register", (req, res) => {
  // Redirect to home if a logged-in user tries to register
  if (users[req.session.user_id]) {
    return res.redirect('/urls');
  }
  return res.render("register", { user: users[req.session.user_id] });
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("You did not fill out the form correctly!");
  } else if (getIdFromEmail(email, users)) {
    return res.status(400).send("Email already in use!");
  }

  // Collision handling for userID
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
  if (users[req.session.user_id]) {
    return res.redirect('/urls');
  }
  return res.render("login", { user: users[req.session.user_id] });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const id = getIdFromEmail(email, users);

  if (!id) {
    return res.status(403).send("Login failed");
  } else if (bcrypt.compareSync(password, users[id].hashedPassword) === false) {
    return res.status(403).send("Login failed");
  } else {
    req.session.user_id = id;
    return res.redirect("urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

