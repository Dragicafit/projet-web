# projet web

## Install

Ce projet utilise [Node.js](https://nodejs.org/en/).

L'installation se fait avec la 
[commande `npm install`](https://docs.npmjs.com/getting-started/installing-npm-packages-locally) :

```sh
$ npm install
```

## Lancer le programme

Le serveur se lance en utilisant la cammande :

```sh
$ node main.js
```

Le site internet est alors accessible via [localhost:3000](http://localhost:3000/)

## Choix fait

J'ai décidé d'implémenter ejs, socket.io et express-session en plus de ce qui est demander pour :
- ejs : mettre en page la vue
- socket.io : permettre la modification instantannée des mémos
- express-session : mieux gérer le connection des utilisateurs