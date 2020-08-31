const express = require('express');

const app = express();
const PORT = 8080; // default port 8080

// set the view engine to ejs
app.set('view engine', 'ejs');

const urlDatabase = {
  lhL: 'http://www.lighthouselabs.ca',
  gOog: 'http://www.google.com',
};

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render('pages/urls_show', templateVars);
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('pages/urls_index', templateVars);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Example app listening on port ${PORT}!`);
});