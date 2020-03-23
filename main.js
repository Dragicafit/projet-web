const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const session = require('express-session');
const saltRounds = 10;

var app = module.exports = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }))
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'ceci est la clé de cookie à garder secret'
}));

app.use(function (req, res, next) {
  var err = req.session.error;
  var msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  next();
});

var users = {
  tj: { name: 'tj' }
};

function auth(username, password, callback) {
  console.log('connexion %s:%s', username);
  var user = users[username];
  if (!user) return callback();

  bcrypt.compare(password, user.hash, function (err, result) {
    if (err) return callback(err);
    if (result) return callback(null, user);
    callback();
  });
}

function inscription(username, password, password2, callback) {
  console.log('inscription %s:%s:%s', username);
  if (password != password2) return callback();
  if (users[username]) return callback();

  bcrypt.hash(password, saltRounds, function (err, hash) {
    if (err) return callback(err);

    if (users[username]) return callback();
    var user = users[username] = { name: username, hash: hash };
    return callback(null, user);
  });
}

app.get('/', function (req, res) {
  if (req.session.user) {
    res.send('<a href="/deconnexion">Déconnexion</a>');
  } else {
    res.render('login');
  }
});

app.get('/deconnexion', function (req, res) {
  req.session.destroy(function () {
    res.redirect('/');
  });
});

app.get('/inscription', function (req, res) {
  if (req.session.user) {
    res.redirect('/');
  } else {
    res.render('register');
  }
});

app.post('/connexion', function (req, res) {
  auth(req.body.username, req.body.password, function (err, user) {
    if (err) throw err;
    if (user) {
      req.session.regenerate(function () {
        req.session.user = user;
        req.session.success = 'Connexion réussie ' + user.name;
        res.redirect('/');
      });
    } else {
      req.session.error = 'Connexion impossible';
      res.redirect('/');
    }
  });
});

app.post('/inscription', function (req, res) {
  inscription(req.body.username, req.body.password, req.body.password2, function (err, user) {
    if (err) throw err;
    if (user) {
      req.session.success = 'Inscription réussie ' + user.name;
      res.redirect('/');
    } else {
      req.session.error = 'Inscription impossible';
      res.redirect('/inscription');
    }
  });
});

app.listen(3000);
console.log('Express démarré sur le port 3000');