const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8080; // default port 8080

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  lhl: 'https://www.lighthouselabs.ca',
  goo: 'https://www.google.com',
  imo: 'https://ombi.ironmantle.ca',
  imj: 'https://jellyfin.ironmantle.ca',

};

const genRandomString = () => Math.random().toString(36).substring(3);

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  // const longURL = ...
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.post('/urls', (req, res) => {
  const shortCode = genRandomString();
  // eslint-disable-next-line no-console
  console.log(req.body); // Log the POST request body to the console
  res.send('Ok'); // Respond with 'Ok' (we will replace this)
  urlDatabase[shortCode] = req.body.longURL;
  res.redirect(urlDatabase[shortCode]);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Example app listening on port ${PORT}!`);
});
