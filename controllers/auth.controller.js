const UserModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { signUpErrors, signInErrors } = require('../utils/errors.utils');

const maxAge = 3 * 24 * 60 * 60 * 1000;

const createToken = (id) => {
  // On va prendre l'id de l'user et la clé secrete et jsonwebtoken va retrouver l'user grâce à ça
  return jwt.sign({id}, process.env.TOKEN_SECRET, {
    expiresIn: maxAge
  })
};

module.exports.signUp = async (req, res) => {
    console.log(req.body);
    const {pseudo, email, password} = req.body
  
    try {
      const user = await UserModel.create({pseudo, email, password });
      res.status(201).json({ user: user._id});
    }
    catch(err) {
      // On envoi l'erreur dans le errors.utils et on récupère la bonne erreur retourné des fonctions
      const errors = signUpErrors(err);
      res.status(200).send({ errors })
    }
  }
 
  module.exports.signIn = async (req, res) => {
    const { email, password } = req.body
  
    try {
      const user = await UserModel.login(email, password);
      const token = createToken(user._id);
      // Je mets dans les cookie le nom 'jwt', ensuite le token, les caracteristiques pour la securité du cookie et l'expiration
      res.cookie('jwt', token, { httpOnly: true, maxAge});
      res.status(200).json({ user: user._id})
    } catch (err){
       const errors = signInErrors(err);
      res.status(200).json({errors});
    }
  }
  // Vide le cookie jwt
  module.exports.logout = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
  }