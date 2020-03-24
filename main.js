const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql')

let con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "UKhzlwBPl9882zEs",
  database: "projet_web"
})

con.connect(function (err) {
  if (err) throw err;

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
  app.use(express.static(path.join(__dirname, 'public')));

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

  function auth(pseudo, motDePasse, callback) {
    console.log('connexion %s', pseudo);

    var sql = "SELECT Hash FROM pseudos WHERE Id LIKE " + con.escape(pseudo)
    con.query(sql, function (err, result) {
      if (err) return callback(err);
      if (!result.length) return callback();

      bcrypt.compare(motDePasse, result[0]['Hash'], function (err, result) {
        if (err) return callback(err);
        if (!result) return callback();
        callback(null, { name: pseudo });
      });
    })
  }

  function inscription(pseudo, motDePasse, motDePasse2, callback) {
    console.log('inscription %s', pseudo);

    if (motDePasse != motDePasse2) return callback();
    var sql = "SELECT Id FROM pseudos WHERE Id LIKE " + con.escape(pseudo)
    con.query(sql, function (err, result) {
      if (err) return callback(err);
      if (result.length) return callback();

      bcrypt.hash(motDePasse, saltRounds, function (err, hash) {
        if (err) return callback(err);

        var sql = "INSERT INTO pseudos (Id, Hash) VALUES (" + con.escape(pseudo) + ", " + con.escape(hash) + ") ON DUPLICATE KEY UPDATE Id = Id"
        con.query(sql, function (err, result) {
          if (err) return callback(err);
          return callback(null, { name: pseudo });
        })
      });
    })
  }

  function memos(pseudo, callback) {
    var sql = "SELECT memos.Id as Id, memos.Titre as Titre, memos.Creation as Crea, memos.Modif as Modif, droits.PseudoId as IdCrea FROM droits LEFT JOIN memos on droits.MemoId = memos.Id WHERE droits.PseudoId LIKE " + con.escape(pseudo)
    con.query(sql, function (err, result) {
      if (err) return callback(err);

      callback(null, result);
    })
  }

  app.get('/', function (req, res) {
    if (req.session.pseudo) {
      var pseudo = req.session.pseudo.name;
      memos(pseudo, (err, memos) => {
        if (err) throw err;
        res.render('memos', {
          titre: 'Accueil',
          pseudo: pseudo,
          memos: memos
        });
      });
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
    if (req.session.pseudo) {
      res.redirect('/');
    } else {
      res.render('register');
    }
  });

  app.post('/connexion', function (req, res) {
    auth(req.body.pseudo, req.body.motDePasse, function (err, pseudo) {
      if (err) throw err;
      if (pseudo) {
        req.session.regenerate(function () {
          req.session.pseudo = pseudo;
          req.session.success = 'Connexion réussie ' + pseudo.name;
          res.redirect('/');
        });
      } else {
        req.session.error = 'Connexion impossible';
        res.redirect('/');
      }
    });
  });

  app.post('/inscription', function (req, res) {
    inscription(req.body.pseudo, req.body.motDePasse, req.body.motDePasse2, function (err, pseudo) {
      if (err) throw err;
      if (pseudo) {
        req.session.success = 'Inscription réussie ' + pseudo.name;
        res.redirect('/');
      } else {
        req.session.error = 'Inscription impossible';
        res.redirect('/inscription');
      }
    });
  });

  app.listen(3000);
  console.log('Express démarré sur le port 3000');
})