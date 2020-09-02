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
const hashPass = (str) => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(str, salt);
  return hash;
};

class User {
  constructor(uid, username, email, passHash) {
    this.uid = uid;
    this.username = username;
    this.email = email;
    this.passHash = passHash;
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

const usersDB = {
  u1ou: {
    uid:'u1ou',
    username: 'clinton',
    email: 'clint.pearce@rocketmail.com',
    passHash: hashPass('test'),
    created: Date.now(),
    sites: {
      lhL: {
        urlShort: 'lhL',
        urlLong: 'https://www.lighthouselabs.ca',
        visits: 0,
        created: Date.now(),
      },
      goo: {
        urlShort: 'goo',
        urlLong: 'https://www.google.ca',
        visits: 0,
        created: Date.now(),
      },
    },
  },
};

// list all URLs
app.get('/urls', (req, res) => {
  const templateVars = {
    user: usersDB[req.cookies.uid],
  };
  res.render('urls_index', templateVars);
});

// debug
app.get('/debug', (req, res) => {
  res.send(usersDB);
});

// create a new URL
app.get('/urls/new', (req, res) => {
  const templateVars = {
    user: usersDB[req.cookies.uid],
  };
  res.render('urls_new', templateVars);
});

// examine a URL closer
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    user: usersDB[req.cookies.uid],
    shortURL: req.params.shortURL,
  };
  res.render('urls_show', templateVars);
});

// register / generate cookie
app.get('/register', (req, res) => {
  const templateVars = {
    user: usersDB[req.cookies.uid],
  };
  res.render('register', templateVars);
});

// create a new user
app.post('/createUser', (req, res) => {
  // req.body = { newUsername: 'X', email: 'Y', password: 'Z' }
  const uid = genRandomString();
  usersDB[uid] = new User(
    uid,
    req.body.newUsername,
    req.body.email,
    hashPass(req.body.password));
  res.cookie('uid', uid);
  res.redirect('/urls');
});

// go to URL long
app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

// add a new URL
app.post('/urls', (req, res) => {
  const shortCode = genRandomString();
  usersDB[req.cookies.uid].sites[shortCode] = {
    urlShort: shortCode,
    urlLong: validateURL(req.body.longURL),
    visits: 0,
    created: Date.now(),
  };
  res.redirect(`/urls/${shortCode}`);
});

// delete URL
app.post('/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.body.shortURL];
  res.redirect('/urls');
});

// update URL
app.post('/:shortURL/update', (req, res) => {
  usersDB[req.cookies.uid].sites[req.params.shortURL].urlLong = req.body.newURL;
  res.redirect('/urls');
});

// login / generate cookie
app.post('/login', (req, res) => {
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
