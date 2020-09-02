// eslint-disable-next-line max-classes-per-file
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 8080;

// set app vars
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/img', express.static(`${__dirname}/public/img`));
app.use(express.static('public'));
app.use(cookieParser());

// function pile
const validateURL = (url) => (url.match(/^(https:\/\/|http:\/\/)/) ? url : `https://${url}`);
const genRandomString = () => Math.random().toString(36).substring(3).slice(-4);
const hashPass = (str) => bcrypt.hash(str, 10).then((hash) => (hash));

class User {
  constructor(username, email, password) {
    this.uid = genRandomString();
    this.username = username;
    this.email = email;
    this.password = password;
    this.created = Date.now();
    this.sites = {};
  }

  addSite(siteURL) {
    this.sites[genRandomString] = {};
    this.sites[genRandomString].url = siteURL;
    this.sites[genRandomString].visits = 0;
    this.sites[genRandomString].created = Date.now();
  }
}
const usersDB = {};
const urlDatabase = {
  lhl: 'https://www.lighthouselabs.ca',
  goo: 'https://www.google.com',
  imo: 'https://ombi.ironmantle.ca',
  imj: 'https://jellyfin.ironmantle.ca',
};

// list all URLs
app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies.username,
  };
  res.render('urls_index', templateVars);
});

// create a new URL
app.get('/urls/new', (req, res) => {
  const templateVars = {
    username: req.cookies.username,
  };
  res.render('urls_new', templateVars);
});

// examine a URL closer
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies.username,
  };
  res.render('urls_show', templateVars);
});

// register / generate cookie
app.get('/register', (req, res) => {
  const templateVars = {
    username: req.cookies.username,
  };
  res.render('register', templateVars);
});

// create a new user
app.post('/createUser', (req, res) => {
  // req.body = { newUsername: 'X', email: 'Y', password: 'Z' }
  usersDB[req.body.newUsername] = new User(req.body.newUsername,
    req.body.email,
    hashPass(req.body.password));
  res.redirect('/urls');
});

// go to URL long
app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

// add a new URL
app.post('/urls', (req, res) => {
  const shortCode = genRandomString();
  urlDatabase[shortCode] = validateURL(req.body.longURL);
  res.redirect(`/urls/${shortCode}`);
});

// delete URL
app.post('/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.body.shortURL];
  res.redirect('/urls');
});

// update URL
app.post('/:shortURL/update', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect('/urls');
});

// login / generate cookie
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// logout / clear cookie
app.post('/logout', (req, res) => {
  // res.send(`You're logging in as ${req.body.username}`);
  res.clearCookie('username');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Example app listening on port ${PORT}!`);
});
