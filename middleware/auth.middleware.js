const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");

// Fonction qui permet de verifier si l'user est connecté 
module.exports.checkUser = (req, res, next) => {
    // on recupere le cookie 'jwt'
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        // on vide le ccokie jwt
        res.cookie("jwt", "", { maxAge: 1 });
        next();
      } else {
        let user = await UserModel.findById(decodedToken.id); 
        res.locals.user = user;
        console.log(res.locals.user);
        next();
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};

//  Middleware lorsque qu'on se connecte pour la première fois sur notre site
//  On verifie si le token est lié à un user existant
module.exports.requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
      if (err) {
        console.log(err);
        res.send(200).json('no token valid')
      } else {
        console.log(decodedToken.id);
        next();
      }
    });
  } else {
    console.log('No token');
  }
};