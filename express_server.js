// eslint-disable-next-line no-console
console.clear();
const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const QuickEncrypt = require('quick-encrypt');
const {
  validateURL, genRandomString, dateParser, hashPass,
} = require('./helperFunctions');

// 1GB key baby
const keys = QuickEncrypt.generate(1024);
const publicKey = keys.public;
const privateKey = keys.private;

const app = express();
const PORT = 8080;

// set app vars
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/img', express.static(`${__dirname}/public/img`));
app.use(express.static('public'));
app.set('trust proxy', 1);
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));

// move to helpFunctions when I figure out broadcast

class User {
  constructor(uid, username, email, passHash) {
    this.uid = uid;
    this.username = username;
    this.email = email;
    this.passHash = passHash;
    this.created = Date.now();
    this.sites = {};
  }
}

// hardcoded user to test
const usersDB = {
  u1ou: {
    uid: 'u1ou',
    username: 'clinton',
    email: 'clint.pearce@rocketmail.com',
    passHash: hashPass('test', publicKey),
    created: Date.now(),
    sites: {
      lhL: {
        urlShort: 'lhL',
        urlLong: 'https://www.lighthouselabs.ca',
        visits: 0,
        created: dateParser(Date.now()),
      },
      goo: {
        urlShort: 'goo',
        urlLong: 'https://www.google.ca',
        visits: 0,
        created: dateParser(Date.now()),
      },
    },
  },
  test: {
    uid: 'test',
    username: 'admin',
    email: 'admin@ironmantle.ca',
    passHash: hashPass('password', publicKey),
    created: Date.now(),
    sites: {
      omb: {
        urlShort: 'omb',
        urlLong: 'https://ombi.ironmantle.ca',
        visits: 0,
        unique: 0,
        created: dateParser(Date.now()),
      },
      go0: {
        urlShort: 'go0',
        urlLong: 'https://www.google.ca',
        visits: 0,
        unique: 0,
        created: dateParser(Date.now()),
      },
    },
  },
};

// like facebook but for lilLinks
const linkBook = {};
// get a list of user email addresses!...
const emails = [...Object.keys(usersDB).map((user) => usersDB[user].email)];
// and usernames!
const userNames = [...Object.keys(usersDB).map((user) => usersDB[user].username)];

const linkBookBuilder = () => {
  // eslint-disable-next-line array-callback-return
  Object.keys(usersDB).map((user) => {
    Object.keys(usersDB[user].sites).forEach((site) => {
      linkBook[site] = usersDB[user].sites[site];
      linkBook[site].user = user;
    });
  });
};

// build our initial linkBook
linkBookBuilder();

// for debug purposes only
app.get('/debug', (req, res) => {
  res.send(linkBook);
});

// login page
app.get('/login', (req, res) => {
  res.render('login');
});

// register new account
app.get('/register', (req, res) => {
  res.render('register');
});

// list all user urls
app.get('/urls', (req, res) => {
  linkBookBuilder();
  if (!req.session.uid) {
    res.render('login');
  } else {
    const templateVars = {
      user: usersDB[req.session.uid],
    };
    res.render('urlIndex', templateVars);
  }
});

// create a new URL
app.get('/urls/new', (req, res) => {
  if (!req.session.uid) {
    res.render('login');
  } else {
    const templateVars = {
      user: usersDB[req.session.uid],
    };
    res.render('urls_new', templateVars);
  }
});

// examine a URL closer
app.get('/urls/:shortURL', (req, res) => {
  if (!req.session.uid) {
    res.render('login');
  } else {
    const templateVars = {
      user: usersDB[req.session.uid],
      site: linkBook[req.params.shortURL],
      shortURL: req.params.shortURL,
    };
    res.render('urlExamine', templateVars);
  }
});

// login post
app.post('/login', (req, res) => {
  if (!req.body.username || !req.body.password) {
    res.status(401).send('All fields must be filled out!');
  } else {
    try {
      const usernameMatch = Object.keys(usersDB)
        .filter((user) => usersDB[user].username === req.body.username);
      const passwordHash = hashPass(req.body.password, publicKey);
      if (
        QuickEncrypt.decrypt(passwordHash, privateKey)
        === QuickEncrypt.decrypt(usersDB[usernameMatch].passHash, privateKey)) {
        req.session.uid = usersDB[usernameMatch].uid;
        res.redirect('/urls');
      } else {
        res.render('ohShit', { status: 401, error: 'Wrong Credentials!' });
      }
    } catch (err) {
      res.render('ohShit', { status: 401, error: 'Wrong Credentials!' });
    }
  }
});

// logout / clear cookie
app.post('/logout', (req, res) => {
  // res.send(`You're logging in as ${req.body.username}`);
  req.session = null;
  res.redirect('/urls');
});

// create a new user
app.post('/createUser', (req, res) => {
  const uid = genRandomString();
  if (!req.body.newUsername || !req.body.email || !req.body.password) {
    res.render('ohShit', { status: 200, error: 'Missing Required Information!' });
  } else if (emails.includes(req.body.email) || userNames.includes(req.body.newUsername)) {
    res.render('ohShit', { status: 401, error: 'Username or Email already in Database!' });
  } else {
    usersDB[uid] = new User(
      uid,
      req.body.newUsername,
      req.body.email,
      hashPass(req.body.password, publicKey),
    );
    req.session.uid = uid;
    res.redirect('/urls');
  }
});

// oh no!
app.get('/error', (req, res) => {
  res.render('ohShit');
});

// add a new URL
app.post('/urls', (req, res) => {
  const shortCode = genRandomString();
  usersDB[req.session.uid].sites[shortCode] = {
    urlShort: shortCode,
    urlLong: validateURL(req.body.longURL),
    visits: 0,
    created: dateParser(Date.now()),
  };
  linkBookBuilder();
  res.redirect(`/urls/${shortCode}`);
});

// delete URL
app.post('/:shortURL/delete', (req, res) => {
  delete usersDB[req.session.uid].sites[req.params.shortURL];
  res.redirect('/urls');
});

// update URL
app.post('/:shortURL/update', (req, res) => {
  usersDB[req.session.uid].sites[req.params.shortURL].urlLong = req.body.newURL;
  res.redirect('/urls');
});

// go to URL long
app.get('/:shortURL', (req, res) => {
  usersDB[linkBook[req.params.shortURL].user].sites[req.params.shortURL].visits += 1;
  res.redirect(usersDB[linkBook[req.params.shortURL].user].sites[req.params.shortURL].urlLong);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`lil'Links listening on port ${PORT}!`);
});
