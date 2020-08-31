const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8080; // default port 8080

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
// <link rel="stylesheet" type="text/css" href="css/style.css" />


const urlDatabase = {
  lhl: 'https://www.lighthouselabs.ca',
  goo: 'https://www.google.com',
  imo: 'https://ombi.ironmantle.ca',
  imj: 'https://jellyfin.ironmantle.ca',

};

const genRandomString = () => Math.random().toString(36).substring(3).slice(-4);
// list all URLs
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});
// create a new URL
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});
// examine a URL closer
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render('urls_show', templateVars);
});
// go to URL long
app.get('/u/:shortURL', (req, res) => {
  // eslint-disable-next-line no-console
  console.log(urlDatabase[req.params.shortURL])
  res.redirect(urlDatabase[req.params.shortURL]);
});
// add a new URL
app.post('/urls', (req, res) => {
  const shortCode = genRandomString();
  // eslint-disable-next-line no-console
  console.log(req.body); // Log the POST request body to the console
  urlDatabase[shortCode] = (req.body.longURL.match(/^(https:\/\/|http:\/\/)/) ? urlDatabase[shortCode] = req.body.longURL : urlDatabase[shortCode] = `https://${req.body.longURL}`);
  res.redirect(`/urls/${shortCode}`);
});

app.post('/:shortURL/delete', (req, res) => {
  // eslint-disable-next-line no-console
  console.log(req.body); // Log the POST request body to the console
  delete urlDatabase[req.params.shortURL];
  // eslint-disable-next-line no-console
  console.log(urlDatabase);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Example app listening on port ${PORT}!`);
});
