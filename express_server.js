const express = require("express");
const app = express();
const PORT = 35353; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const { getIdFromEmail } = require('./helpers');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['secret']
}));
app.use(methodOverride('_method'));

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
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
  res.redirect("urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
  res.send("<html><body>Hello <b>World</b></body></htm>\n");
});

app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    return res.redirect("login");
  }
  const urls = urlsForUser(user.id);
  let templateVars = { urls, user };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {

  if (!req.session["user_id"]) {
    res.redirect("../login");
  } else {
    res.render("urls_new", { user: users[(req.session["user_id"])] });
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const { longURL } = urlDatabase[shortURL];
  let templateVars = { shortURL, longURL, user: users[(req.session["user_id"])] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].longURL = req.body.longURL;
  urlDatabase[shortURL].userID = req.session["user_id"];
  res.redirect(`urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.send("Invalid shortURL!");
  }

  const { longURL } = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.newLongURL;
  urlDatabase[shortURL].longURL = newLongURL;
  res.redirect("..");
});

app.delete("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session["user_id"];
  if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userID) {
    delete urlDatabase[shortURL];
    res.redirect("..");
  } else {
    res.status(401).send("Operation failed");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("urls");
});

app.get("/register", (req, res) => {
  res.render("register", { user: users[req.session["user_id"]] });
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("You did not fill out the form correctly!");
  } else if (getIdFromEmail(email, users)) {
    return res.status(400).send("Email already in use!");
  }
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = { id, email, hashedPassword };
  users[id] = newUser;
  req.session.user_id = id;
  res.redirect("urls");
});

app.get("/login", (req, res) => {
  res.render("login", { user: users[req.session.user_id] });
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

function generateRandomString() {
  let string = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charLength = chars.length;

  for (let i = 0; i < 6; i++) {
    string += chars.charAt(Math.floor(Math.random() * charLength));
  }
  return string;
}

// Filters urlDatabase to only those with id of current user
function urlsForUser(id) {
  const result = {};
  for (key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      result[key] = urlDatabase[key];
    }
  }
  return result;
}