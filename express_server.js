// eslint-disable-next-line no-console
console.clear();
const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const QuickEncrypt = require('quick-encrypt');
const {
  validateURL, genRandomString, dateParser, hashPass,
} = require('./helperFunctions');

// 1 0 2 4 B I T   K E Y   B A B Y ////////////////////////
const keys = QuickEncrypt.generate(1024);
const publicKey = keys.public;
const privateKey = keys.private;

const app = express();
const PORT = 8080;

// E X P R E S S   A R G S ////////////////////////////////
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/img', express.static(`${__dirname}/public/img`));
app.use(express.static('public'));
app.set('trust proxy', 1);
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));

// U S E R   C L A S S  ///////////////////////////////////
class User {
  constructor(uid, email, passHash) {
    this.uid = uid;
    this.email = email;
    this.passHash = passHash;
    this.created = Date.now();
    this.sites = {};
  }
}

// H A R D C O D E D   U S E R   D A T A //////////////////
const usersDB = {
  u1ou: {
    uid: 'u1ou',
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

// L I N K   M A P   &   M E T A D A T A   M A P S ////////
const linkBook = {};
const emails = [...Object.keys(usersDB).map((user) => usersDB[user].email)];
const linkBookBuilder = () => {
  // eslint-disable-next-line array-callback-return
  Object.keys(usersDB).map((user) => {
    Object.keys(usersDB[user].sites).forEach((site) => {
      linkBook[site] = usersDB[user].sites[site];
      linkBook[site].user = user;
    });
  });
};
linkBookBuilder();

// G E T   R O U T E S ////////////////////////////////////

// C A T C H A L L   G E T
app.get('/', (req, res) => {
  if (!req.session.uid) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

// D E B U G   R O U T E   G E T
app.get('/debug', (req, res) => {
  res.send(linkBook);
});

// L O G I N   G E T
app.get('/login', (req, res) => {
  if (req.session.uid) res.redirect('urls');
  res.render('login');
});

// R E G I S T E R   G E T
app.get('/register', (req, res) => {
  res.render('register');
});

// I N D E X   G E T
app.get('/urls', (req, res) => {
  linkBookBuilder();
  if (!req.session.uid) {
    res.render('errorPage', { status: 400, error: 'Not Logged In!' });
  } else {
    const templateVars = {
      user: usersDB[req.session.uid],
    };
    res.render('urlIndex', templateVars);
  }
});

// C R E A T E   U R L   G E T
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

// E X A M I N E   U R L   G E T
app.get('/urls/:shortURL', (req, res) => {
  if (!req.session.uid) {
    res.redirect('login');
  } else if (!Object.keys(linkBook).includes(req.params.shortURL)) {
    res.render('errorPage', { status: 404, error: 'Sorry that link doesn\'t exist!' });
  } else if (req.session.uid !== linkBook[req.params.shortURL].user) {
    res.render('errorPage', { status: 401, error: 'Sorry you don\'t own this link!' });
  } else {
    const templateVars = {
      user: usersDB[req.session.uid],
      site: linkBook[req.params.shortURL],
      shortURL: req.params.shortURL,
    };
    res.render('urlExamine', templateVars);
  }
});

//  E R R O R   G E T
app.get('/error', (req, res) => {
  res.render('errorPage');
});

// P O S T   R O U T E S //////////////////////////////////

// L O G I N   P O S T
app.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.render('errorPage', { status: 400, error: 'All Data Fields Must Be Filled Out!' });
  } else {
    try {
      const emailMatch = Object.keys(usersDB)
        .filter((user) => usersDB[user].email === req.body.email);
      const passwordHash = hashPass(req.body.password, publicKey);
      if (
        QuickEncrypt.decrypt(passwordHash, privateKey)
        === QuickEncrypt.decrypt(usersDB[emailMatch].passHash, privateKey)) {
        req.session.uid = usersDB[emailMatch].uid;
        res.redirect('/urls');
      } else {
        res.render('errorPage', { status: 401, error: 'Wrong Credentials!' });
      }
    } catch (err) {
      res.render('errorPage', { status: 401, error: 'Wrong Credentials!' });
    }
  }
});

// L O G O U T   &   C L E A R   C O O K I E   P O S T
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// C R E A T E   U S E R   P O S T
app.post('/register', (req, res) => {
  const uid = genRandomString();
  if (!req.body.email || !req.body.password) {
    res.render('errorPage', { status: 400, error: 'Missing Required Information!' });
  } else if (emails.includes(req.body.email)) {
    res.render('errorPage', { status: 403, error: 'Email already in Database!' });
  } else {
    usersDB[uid] = new User(
      uid,
      req.body.email,
      hashPass(req.body.password, publicKey),
    );
    req.session.uid = uid;
    res.redirect('/urls');
  }
});

// A D D   N E W   U R L   P O S T
app.post('/urls', (req, res) => {
  if (!req.session.uid) res.render({ status: 400, error: 'You need to be logged in to do that!' });
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

// D E L E T E   U R L   P O S T
app.post('/:shortURL/delete', (req, res) => {
  if (req.session.uid === linkBook[req.params.shortURL].user) {
    delete usersDB[req.session.uid].sites[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.render({ status: 401, error: 'All Your lil\'Link Are NOT Beling To Us!' });
  }
});

// U P D A T E   U R L   P O S T
app.post('/:shortURL/update', (req, res) => {
  if (!req.session.uid) {
    res.render({ status: 400, error: 'You need to be logged in!' });
  } else if (req.session.uid === linkBook[req.params.shortURL].user) {
    usersDB[req.session.uid].sites[req.params.shortURL].urlLong = req.body.newURL;
    res.redirect('/urls');
  } else {
    res.render({ status: 401, error: 'All Your lil\'Link Are NOT Beling To Us!' });
  }
});

// G L O B A L   G O   T O   S H O R T   U R L   G E T
app.get('/u/:shortURL', (req, res) => {
  linkBookBuilder();
  if (!Object.keys(linkBook).includes(req.params.shortURL)) {
    res.render('errorPage', { status: 404, error: 'That URL Does Not Exist Here Friend!' });
  } else {
    usersDB[linkBook[req.params.shortURL].user].sites[req.params.shortURL].visits += 1;
    res.redirect(usersDB[linkBook[req.params.shortURL].user].sites[req.params.shortURL].urlLong);
  }
});

// S T A R T   T H E   L I S T E N E R
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`lil'Links listening on port ${PORT}!`);
});
