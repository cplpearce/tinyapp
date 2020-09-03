// eslint-disable-next-line no-console
console.clear();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const QuickEncrypt = require('quick-encrypt');

const keys = QuickEncrypt.generate(2048); // Use either 2048 bits or 1024 bits.
const publicKey = keys.public;
const privateKey = keys.private;

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
const dateParser = (date) => {
  const d = new Date(date);
  return `${d.getUTCDay()}
  /${d.getMonth()}
  /${d.getFullYear()}
  /${d.getHours()}
  :${d.getMinutes()}
  :${(`0${d.getSeconds()}`).slice(-2)}`.replace(/\s/g, '');
};
const hashPass = (str) => QuickEncrypt.encrypt(str, publicKey);

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
    passHash: hashPass('test'),
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
    passHash: hashPass('password'),
    created: Date.now(),
    sites: {
      omb: {
        urlShort: 'omb',
        urlLong: 'https://ombi.ironmanlte.ca',
        visits: 0,
        created: dateParser(Date.now()),
      },
      go0: {
        urlShort: 'go0',
        urlLong: 'https://www.google.ca',
        visits: 0,
        created: dateParser(Date.now()),
      },
    },
  },
};

const linkBook = {};

const linkBookBuilder = () => {
  Object.keys(usersDB).map((user) => {
    Object.keys(usersDB[user].sites).forEach((site) => {
      linkBook[site] = usersDB[user].sites[site];
      linkBook[site].user = user;
    });
  });
};
// build our initial linkBook
linkBookBuilder();

// login / generate cookie
app.get('/login', (req, res) => {
  res.render('login');
});

// list all URLs
app.get('/urls', (req, res) => {
  linkBookBuilder();
  if (!req.cookies.uid) {
    res.render('login');
  } else {
    const templateVars = {
      user: usersDB[req.cookies.uid],
    };
    res.render('urls_index', templateVars);
  }
});

// debug
app.get('/debug', (req, res) => {
  res.send(linkBook);
});

// create a new URL
app.get('/urls/new', (req, res) => {
  if (!req.cookies.uid) {
    res.render('login');
  } else {
    const templateVars = {
      user: usersDB[req.cookies.uid],
    };
    res.render('urls_new', templateVars);
  }
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

// go to URL long
app.get('/:shortURL', (req, res) => {
  usersDB[linkBook[req.params.shortURL].user].sites[req.params.shortURL].visits += 1;
  res.redirect(usersDB[req.cookies.uid].sites[req.params.shortURL].urlLong);
});

// login post
app.post('/login', (req, res) => {
  if (!req.body.username || !req.body.password) {
    res.write('bad');
  } else {
    const usernameMatch = Object.keys(usersDB)
      .filter((user) => usersDB[user].username === req.body.username);
    const passwordHash = hashPass(req.body.password);
    // remove me later
    if (
      QuickEncrypt.decrypt(passwordHash, privateKey)
      === QuickEncrypt.decrypt(usersDB[usernameMatch].passHash, privateKey)) {
      res.cookie('uid', usersDB[usernameMatch].uid);
      res.redirect('/urls');
    } else {
      res.redirect('login');
    }
  }
});

// create a new user
app.post('/createUser', (req, res) => {
  const uid = genRandomString();
  if (!req.body.newUsername || !req.body.email || !req.body.password) {
    res.statusCode = 200;
    res.send('Error, missing information');
  } else {
    usersDB[uid] = new User(
      uid,
      req.body.newUsername,
      req.body.email,
      hashPass(req.body.password),
    );
    res.cookie('uid', uid);
    res.redirect('/urls');
  }
});

// add a new URL
app.post('/urls', (req, res) => {
  const shortCode = genRandomString();
  usersDB[req.cookies.uid].sites[shortCode] = {
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
  delete usersDB[req.cookies.uid].sites[req.params.shortURL];
  res.redirect('/urls');
});

// update URL
app.post('/:shortURL/update', (req, res) => {
  usersDB[req.cookies.uid].sites[req.params.shortURL].urlLong = req.body.newURL;
  res.redirect('/urls');
});

// logout / clear cookie
app.post('/logout', (req, res) => {
  // res.send(`You're logging in as ${req.body.username}`);
  res.clearCookie('uid');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`lil'Links listening on port ${PORT}!`);
});
