const postModel = require("../models/post.model");
const PostModel = require("../models/post.model");
const UserModel = require("../models/user.model");
const { uploadErrors } = require("../utils/errors.utils");
const ObjectID = require("mongoose").Types.ObjectId;
const fs = require("fs");
const { promisify } = require("util");
const pipeline = promisify(require("stream").pipeline);

module.exports.readPost = (req, res) => { 
    // on recupère les posts qu'on met dans docs
    PostModel.find((err, docs) => {
        // Si pas d'erreur on envoi la docs
      if (!err) res.send(docs);
      else console.log("Error to get data : " + err);
      // On tri les posts du + recent au + ancien
    }).sort({ createdAt: -1 });
  };

  module.exports.createPost = async (req, res) => {
    let fileName;
  
    if (req.file !== null) {
      try {
        if (
          req.file.detectedMimeType != "image/jpg" &&
          req.file.detectedMimeType != "image/png" &&
          req.file.detectedMimeType != "image/jpeg"
        )
          throw Error("invalid file");
  
        if (req.file.size > 1000000) throw Error("max size");
      } catch (err) {
        const errors = uploadErrors(err);
        return res.status(201).json({ errors });
      }
      // On rajoute l'id de l'user et la date pour avoir un nom unique
      fileName = req.body.posterId + Date.now() + ".jpg";
  
      await pipeline(
        req.file.stream,
        fs.createWriteStream(
            // on stock le file de la requete dans ce repertoire
          `${__dirname}/../client/public/uploads/posts/${fileName}`
        )
      );
    }
  
    // On incremente notre postModel
    const newPost = new postModel({
    // Tous les champs notre requete qu'on va vouloir envoyé en bdd
      posterId: req.body.posterId,
      message: req.body.message,
      // on met le lien dans picture si il n'est pas null on met le chemin sinon il est vide
      picture: req.file !== null ? "./uploads/posts/" + fileName : "",
      video: req.body.video,
      likers: [],
      comments: [],
    });
  // on envoi dans mongodb  avec try 
    try {
      const post = await newPost.save();
      // on renvoi le post en reponse si ça marche
      return res.status(201).json(post);
    } catch (err) {
      return res.status(400).send(err);
    }
  };

  module.exports.updatePost = (req, res) => {
      // On verifie l'id qu'on passe en paramettre est valide
    if (!ObjectID.isValid(req.params.id))
      return res.status(400).send("ID unknown : " + req.params.id);
  
      // On stock le nouveau message qu'on souhaite modifier
    const updatedRecord = {
      message: req.body.message,
    };
  
    // On recupere le post en fonction de l'id qu'on a passé en param dans l'url
    PostModel.findByIdAndUpdate(
      req.params.id,
      //$set pour faire une maj en mettant le new message
      { $set: updatedRecord },
      { new: true },
      //callback si y'a une erreur sinon on envoi les data dans docs
      (err, docs) => {
          // on envoi les donnée dans la reponse
        if (!err) res.send(docs);
        else console.log("Update error : " + err);
      }
    );
  };

  module.exports.deletePost = (req, res) => {
       // On verifie l'id qu'on passe en paramettre est valide
    if (!ObjectID.isValid(req.params.id))
      return res.status(400).send("ID unknown : " + req.params.id);

      // On recupere le post en fonction de l'id qu'on a passé en param dans l'url
    PostModel.findByIdAndRemove(req.params.id, (err, docs) => {
      if (!err) res.send(docs);
      else console.log("Delete error : " + err);
    });
  };

  module.exports.likePost = async (req, res) => {
    // On verifie l'id qu'on passe en paramettre est valide
    if (!ObjectID.isValid(req.params.id))
      return res.status(400).send("ID unknown : " + req.params.id);

    // Avec un try on essaye la requete
    try {
    // On recupere et on modifie le post avec l'id passer en param de la requete
      await PostModel.findByIdAndUpdate(
        req.params.id,
        {
        // Avec addToSet on modifie en ajoutant l'id de la personne qui a liké qu'on a recuperer dans le body de la requete
          $addToSet: { likers: req.body.id },
        },
        { new: true },
        (err, docs) => {
          if (err) return res.status(400).send(err);
        }
      );
    // On recupere et on modifie l'user avec le post qui a été liké
      await UserModel.findByIdAndUpdate(
        // On récupère l'id 
        req.body.id,
        {
            // Avec addToSet on modifie en ajoutant l'id de post qu'on a recuperer dans les params à la personne qui a liké
          $addToSet: { likes: req.params.id },
        },
        { new: true },
        (err, docs) => {
          if (!err) res.send(docs);
          else return res.status(400).send(err);
        }
      );
    } catch (err) {
      return res.status(400).send(err);
    }
  };
  
  module.exports.unlikePost = async (req, res) => {
    // On verifie que l'id passé en parametre est valide
    if (!ObjectID.isValid(req.params.id))
      return res.status(400).send("ID unknown : " + req.params.id);
  
    try {
    // On recupere le post avec l'id passé en parametre pour modifier ensuite
      await PostModel.findByIdAndUpdate(
        req.params.id,
        {
        // Avec pull on enleve l'user qui a liké en passant l'id dans le body
          $pull: { likers: req.body.id },
        },
        { new: true },
        (err, docs) => {
          if (err) return res.status(400).send(err);
        }
      );
      // On recupere l'user avec l'id passé en parametre pour modifier ensuite
      await UserModel.findByIdAndUpdate(
        req.body.id,
        {
            // Avec pull on enleve le post que l'user a liké en recuperant l'id passé en param
          $pull: { likes: req.params.id },
        },
        { new: true },
        (err, docs) => {
          if (!err) res.send(docs);
          else return res.status(400).send(err);
        }
      );
    } catch (err) {
      return res.status(400).send(err);
    }
  };

  module.exports.commentPost = (req, res) => {
    // On verifie que l'id passé est valide
    if (!ObjectID.isValid(req.params.id))
      return res.status(400).send("ID unknown : " + req.params.id);
  
      // On fait un try pour essayer la requete
    try {
      // On récupere l'id du post pour lui ajouter un commentaire  
      return PostModel.findByIdAndUpdate(
        req.params.id,
        {
            // On push le tableau comments du PostModel sans supprimer les autres comments
          $push: {
            comments: {
                // On recupere l'id de la personne qui a fait le commentaire dans le body de la requete
              commenterId: req.body.commenterId,
                // On récupère le pseudo de l'user passé dans le body
              commenterPseudo: req.body.commenterPseudo,
              text: req.body.text,
              // On lui ajoute la date de creation car elle est faite automatiquement a la creation du post dans le modele
              timestamp: new Date().getTime(),
            },
          },
        },
        { new: true },
        (err, docs) => {
          if (!err) return res.send(docs);
          else return res.status(400).send(err);
        }
      );
    } catch (err) {
      return res.status(400).send(err);
    }
  };

  module.exports.editCommentPost = (req, res) => {
      // On verifie si l'id passé en param est valide
    if (!ObjectID.isValid(req.params.id))
      return res.status(400).send("ID unknown : " + req.params.id);
  
      // On essaye la requete avec un try catch
    try {
        // Je récupère un post par l'id passé en param
      return PostModel.findById(req.params.id, (err, docs) => {
          // Avec docs qui nous retourne toutes les informations du post
          // Dans le tableau de comments je cherche le comment
        const theComment = docs.comments.find((comment) =>
        // Il faut que le comment._id soit egal au commentaire de l'id qu'on va passé dans le body
          comment._id.equals(req.body.commentId)

          // theComment contient le commentaire qu'on veut edit
        );
  
        // Si on trouve pas de commentaire dan la bdd
        if (!theComment) return res.status(404).send("Comment not found");
        // On va rentrer dans l'object comments puis text et on va y mettre le nouveau text
        theComment.text = req.body.text;
  
        // On sauvegarde la maj 
        return docs.save((err) => {
            // Si pas d'erreur on envoi ce qui a été modifié
          if (!err) return res.status(200).send(docs);
          return res.status(500).send(err);
        });
      });
    } catch (err) {
      return res.status(400).send(err);
    }
  };

  module.exports.deleteCommentPost = (req, res) => {
      // On verifie si l'id passé en param est valide
    if (!ObjectID.isValid(req.params.id))
      return res.status(400).send("ID unknown : " + req.params.id);
  // on fait un try catch de notre requete
    try {
      return PostModel.findByIdAndUpdate(
        req.params.id,
        {
            // on enleve le commentaire en lui passant l'id du commentaire dans le body
          $pull: {
            comments: {
                // on enleve le comments qui a l'_id: 
              _id: req.body.commentId,
            },
          },
        },
        { new: true },
        (err, docs) => {
          if (!err) return res.send(docs);
          else return res.status(400).send(err);
        }
      );
    } catch (err) {
      return res.status(400).send(err);
    }
  };