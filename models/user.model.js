// appel de la bibliothèque mongoose
const mongoose = require('mongoose');
// appel de la bibliothèque validator et la methode isEmail
const { isEmail } = require('validator'); 
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    pseudo: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 55,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      validate: [isEmail],
      lowercase: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      max: 1024,
      minlength: 6
    },
    picture: {
       // le string est le chemin de cette photo qui sera stocke
      type: String,
      // valeur par defaut
      default: "./uploads/profil/random-user.png"
    },
    bio :{
      type: String,
      max: 1024,
    },
    followers: {
      // Contient les id de ses followers
      type: [String]
    },
    following: {
      // Contient les id de ses followings
      type: [String]
    },
    likes: {
      // Contient les id de posts qu'elle a liker pour eviter qu'elle like plusieurs fois
      // On mettra un coeur rouge pour montrer qu'elle a liker avec un if
      type: [String]
    }
  },
  {
    timestamps: true,
  }
);

// play function before save into display: 'block',
userSchema.pre("save", async function(next) {
  // On attend que Bcrypt nous genere son hash
  const salt = await bcrypt.genSalt();
  // On attend que bcrypt hash le mot de passe envoyé
  this.password = await bcrypt.hash(this.password, salt);
  // Pour passer à la suite une fois chaque ligne effectué
  next();
});

userSchema.statics.login = async function(email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw Error('incorrect password');
  }
  throw Error('incorrect email')
};

const UserModel = mongoose.model("user", userSchema);

module.exports = UserModel; 