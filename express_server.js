const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[(req.cookies["user_id"])] };
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new', { user: users[(req.cookies["user_id"])] });
});

app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  let templateVars = { shortURL, longURL, user: users[(req.cookies["user_id"])] };
  res.render('urls_show', templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.newLongURL;
  urlDatabase[shortURL] = newLongURL;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post('/logout', (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get('/register', (req, res) => {
  res.render('register', { user: users[req.cookies["user_id"]] });
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send('You did not fill out the form correctly!');
  } else if (getIdFromEmail(email)) {
    res.status(400).send('Email already in use!');
  }
  const id = generateRandomString();
  const newUser = { id, email, password };
  users[id] = newUser;
  res.cookie('user_id', id);
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  res.render('login', { user: users[req.cookies["user_id"]] });
});

app.post('/login', (req, res) => {
  res.send('TODO');
});
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let string = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charLength = chars.length;

  for (let i = 0; i < 6; i++) {
    string += chars.charAt(Math.floor(Math.random() * charLength));
  }
  return string;
}

function getIdFromEmail(email) {
  for (const key in users) {
    if (users[key].email === email) {
      return key;
    }
  }
  return null;
}