const UserModel = require("../models/user.model");
const ObjectID = require("mongoose").Types.ObjectId;

// Permet de récuperer tous les users
module.exports.getAllUsers = async (req, res) => {
    // On demande de ne pas envoyer le password: on select tout sauf le password
  const users = await UserModel.find().select("-password");
  res.status(200).json(users);
};

// Permet de récuperer les info d'un seul user (celui qui est connecté)
module.exports.userInfo = (req, res) => {
    // On test si l'id est connu dans la bdd grace a ObjectId de mongoose
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);
 // permet de récuperer un user par id
  UserModel.findById(req.params.id, (err, data) => {
      // Si il n'y a pas d'erreur on envoi la data en reponse
    if (!err) res.send(data);
    else console.log("ID unknown : " + err);
  }).select("-password");
};

// Permet de modifier un user
module.exports.updateUser = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    await UserModel.findOneAndUpdate(
        // on donne un id reçu dans les paramatre de la requete
      { _id: req.params.id },
      {
          // On choisi ce qu'on modifie
        $set: {
          // C'est la bio qu'on passe dans le body  
          bio: req.body.bio,
        },
      },
      // Parametre obligatoire a mettre dans un PUT
      { new: true, upsert: true, setDefaultsOnInsert: true },
      (err, docs) => {
        if (!err) return res.send(docs);
        if (err) return res.status(500).send({ message: err });
      }
    );
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

// Permet de supprimer un user
module.exports.deleteUser = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    await UserModel.remove({ _id: req.params.id }).exec();
    res.status(200).json({ message: "Successfully deleted. " });
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

// Fonction permettant de follow quelqu'un
module.exports.follow = async (req, res) => {
  if (
    // On verifie que l'id dan
    !ObjectID.isValid(req.params.id) ||
    !ObjectID.isValid(req.body.idToFollow)
  )
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    // add to the follower list
    await UserModel.findByIdAndUpdate(
      req.params.id,
      // AddToSet = ajoute à ce qu'on a deja mis
      // idToFollow on va clicker sur la personne qui est suivi
      { $addToSet: { following: req.body.idToFollow } },
      { new: true, upsert: true },
      (err, docs) => {
        if (!err) res.status(201).json(docs);
        else return res.status(400).jsos(err);
      }
    );
    // add to following list
    await UserModel.findByIdAndUpdate(
      // On récupère l'id de la personne qui va être suivi
      req.body.idToFollow,
      // on ajoute à ce qu'on a déjà la personne qui va suivre  
      { $addToSet: { followers: req.params.id } },
      { new: true, upsert: true },
      (err, docs) => {
        // if (!err) res.status(201).json(docs);
        if (err) return res.status(400).jsos(err);
      }
    );
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

module.exports.unfollow = async (req, res) => {
  if (
    !ObjectID.isValid(req.params.id) ||
    !ObjectID.isValid(req.body.idToUnfollow)
  )
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    await UserModel.findByIdAndUpdate(
      req.params.id,
      //  Pull sert à retirer un element du tableau contrairement à AddToSet
      { $pull: { following: req.body.idToUnfollow } },
      { new: true, upsert: true },
      (err, docs) => {
        if (!err) res.status(201).json(docs);
        else return res.status(400).jsos(err);
      }
    );
    // remove to following list
    await UserModel.findByIdAndUpdate(
      req.body.idToUnfollow,
      //  Pull sert à retirer un element du tableau contrairement à AddToSet
      { $pull: { followers: req.params.id } },
      { new: true, upsert: true },
      (err, docs) => {
        // if (!err) res.status(201).json(docs);
        if (err) return res.status(400).jsos(err);
      }
    );
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};