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

  function connexion(pseudo, motDePasse, callback) {
    console.log('connexion %s', pseudo);

    if (motDePasse.length < 8 || motDePasse.length > 32) return callback();
    var sql = "SELECT Hash FROM utilisateurs WHERE Id LIKE " + con.escape(pseudo)
    con.query(sql, function (err, result) {
      if (err) return callback(err);
      if (!result.length) return callback();

      bcrypt.compare(motDePasse, result[0]['Hash'], function (err, result) {
        if (err) return callback(err);
        if (!result) return callback();
        callback(null, { pseudo: pseudo });
      });
    })
  }

  function inscription(pseudo, motDePasse, motDePasse2, callback) {
    console.log('inscription %s', pseudo);

    if (motDePasse != motDePasse2) return callback();
    if (motDePasse.length < 8 || motDePasse.length > 32) return callback();
    var sql = "SELECT Id FROM utilisateurs WHERE Id LIKE " + con.escape(pseudo)
    con.query(sql, function (err, result) {
      if (err) return callback(err);
      if (result.length) return callback();

      bcrypt.hash(motDePasse, saltRounds, function (err, hash) {
        if (err) return callback(err);

        var sql = "INSERT INTO utilisateurs (Id, Hash) VALUES (" + con.escape(pseudo) + ", " + con.escape(hash) + ") ON DUPLICATE KEY UPDATE Id = Id"
        con.query(sql, function (err, result) {
          if (err) return callback(err);
          return callback(null, { pseudo: pseudo });
        })
      });
    })
  }

  function modif(pseudo, ancienMotDePasse, motDePasse, motDePasse2, callback) {
    console.log('mofication %s', pseudo);

    if (motDePasse != motDePasse2) return callback();
    if (motDePasse.length < 8 || motDePasse.length > 32) return callback();
    var sql = "SELECT Hash FROM utilisateurs WHERE Id LIKE " + con.escape(pseudo)
    con.query(sql, function (err, result) {
      if (err) return callback(err);
      if (!result.length) return callback();

      bcrypt.compare(ancienMotDePasse, result[0]['Hash'], function (err, result) {
        if (err) return callback(err);
        if (!result) return callback();

        bcrypt.hash(motDePasse, saltRounds, function (err, hash) {
          if (err) return callback(err);

          var sql = "UPDATE utilisateurs SET Hash = " + con.escape(hash) + " WHERE Id = " + con.escape(pseudo)
          con.query(sql, function (err) {
            if (err) return callback(err);
            return callback(null, { pseudo: pseudo });
          });
        });
      });
    });
  }

  function memos(pseudo, callback) {
    var sql = "SELECT memos.Id as Id, memos.Texte as Texte, memos.Creation as Crea, memos.Modif as Modif, droits.PseudoId as IdCrea FROM droits LEFT JOIN memos on droits.MemoId = memos.Id WHERE droits.PseudoId LIKE " + con.escape(pseudo)
    con.query(sql, function (err, result) {
      if (err) return callback(err);

      callback(null, result);
    })
  }

  function creerMemo(pseudo, texte, callback) {
    var sql = "INSERT INTO memos (Texte) VALUES (" + con.escape(texte) + ")"
    con.query(sql, function (err, result) {
      if (err) return callback(err);

      var sql = "INSERT INTO droits (PseudoId, MemoId, Droit) VALUES (" + con.escape(pseudo) + ", " + con.escape(result.insertId) + ", 0)"
      con.query(sql, function (err, result) {
        if (err) return callback(err);

        callback();
      })
    })
  }

  function supprMemo(pseudo, id, callback) {
    var sql = "SELECT * FROM droits WHERE PseudoId LIKE " + con.escape(pseudo) + " and MemoId = " + con.escape(id) + " and Droit = 0"
    con.query(sql, function (err, result) {
      if (err) return callback(err);
      if (!result.length) callback();

      var sql = "DELETE FROM droits WHERE MemoId = " + con.escape(id)
      con.query(sql, function (err, result) {
        if (err) return callback(err);

        var sql = "DELETE FROM memos WHERE Id = " + con.escape(id)
        con.query(sql, function (err, result) {
          if (err) return callback(err);

          callback();
        })
      })
    })
  }

  function supprUtilisateur(pseudo, callback) {
    var sql = "DELETE FROM utilisateurs WHERE Id LIKE " + con.escape(pseudo);
    con.query(sql, function (err) {
      if (err) return callback(err);

      var sql = "SELECT MemoId FROM droits WHERE PseudoId LIKE " + con.escape(pseudo) + " and Droit = 0";
      con.query(sql, function (err, result) {
        if (err) return callback(err);

        var sql = "DELETE FROM droits WHERE PseudoId LIKE " + con.escape(pseudo);
        con.query(sql, function (err) {
          if (err) return callback(err);
          if (!result.length) return callback();

          var first = result.pop()['MemoId']
          var sql = "DELETE FROM droits WHERE MemoId = " + first;
          result.forEach(memo => {
            sql += " or MemoId = " + con.escape(memo['MemoId']);
          })

          con.query(sql, function (err) {
            if (err) return callback(err);

            var sql = "DELETE FROM memos WHERE Id = " + first;
            result.forEach(memo => {
              sql += " or Id = " + con.escape(memo['MemoId']);
            })

            con.query(sql, function (err) {
              if (err) return callback(err);

              callback();
            });
          });
        });
      });
    });
  }

  app.get('/', function (req, res) {
    if (req.session.utilisateur) {
      var pseudo = req.session.utilisateur.pseudo;
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
    if (req.session.utilisateur) {
      res.redirect('/');
    } else {
      res.render('register');
    }
  });

  app.get('/monCompte', function (req, res) {
    if (req.session.utilisateur) {
      res.render('monCompte');
    } else {
      res.redirect('/');
    }
  });

  app.post('/connexion', function (req, res) {
    if (req.session.utilisateur) {
      res.redirect('/');
    } else {
      connexion(req.body.pseudo, req.body.motDePasse, function (err, utilisateur) {
        if (err) throw err;
        if (utilisateur) {
          req.session.regenerate(function () {
            req.session.utilisateur = utilisateur;
            req.session.success = 'Connexion réussie ' + utilisateur.pseudo;
            res.redirect('/');
          });
        } else {
          req.session.error = 'Connexion impossible';
          res.redirect('/');
        }
      });
    }
  });

  app.post('/inscription', function (req, res) {
    if (req.session.utilisateur) {
      res.redirect('/');
    } else {
      inscription(req.body.pseudo, req.body.motDePasse, req.body.motDePasse2, function (err, utilisateur) {
        if (err) throw err;
        if (utilisateur) {
          req.session.success = 'Inscription réussie ' + utilisateur.pseudo;
          res.redirect('/');
        } else {
          req.session.error = 'Inscription impossible';
          res.redirect('/inscription');
        }
      });
    }
  });

  app.post('/modifierCompte', function (req, res) {
    if (req.session.utilisateur) {
      modif(req.session.utilisateur.pseudo, req.body.ancienMotDePasse, req.body.motDePasse, req.body.motDePasse2, function (err, utilisateur) {
        if (err) throw err;
        if (utilisateur) {
          req.session.success = 'Modification réussie ' + utilisateur.pseudo;
          res.redirect('/');
        } else {
          req.session.error = 'Modification impossible';
          res.redirect('/monCompte');
        }
      });
    } else {
      res.redirect('/');
    }
  });

  app.post('/creerMemo', function (req, res) {
    if (!req.session.utilisateur) {
      res.redirect('/');
    } else {
      creerMemo(req.session.utilisateur.pseudo, req.body.texte, function (err) {
        if (err) throw err;
        res.redirect('back');
      });
    }
  });

  app.get('/supprMemo', function (req, res) {
    if (!req.session.utilisateur) {
      res.redirect('/');
    } else {
      supprMemo(req.session.utilisateur.pseudo, req.query.id, function (err) {
        if (err) throw err;
        res.redirect('back');
      });
    }
  });

  app.get('/supprUtilisateur', function (req, res) {
    if (!req.session.utilisateur) {
      res.redirect('/');
    } else {
      supprUtilisateur(req.session.utilisateur.pseudo, function (err) {
        if (err) throw err;
        req.session.destroy(function () {
          res.redirect('/');
        });
      });
    }
  });

  app.listen(3000);
  console.log('Express démarré sur le port 3000');
})