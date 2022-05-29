const UserModel = require("../models/user.model");
// permet d'incrementer des elements dans des fichiers grâce à la dependance filesystem
const fs = require("fs");
const { promisify } = require("util");
const pipeline = promisify(require("stream").pipeline);
const { uploadErrors } = require("../utils/errors.utils");

module.exports.uploadProfil = async (req, res) => {
  try {
    // On verifie si l'extension du fichier est correct
    if (
      req.file.detectedMimeType != "image/jpg" &&
      req.file.detectedMimeType != "image/png" &&
      req.file.detectedMimeType != "image/jpeg"
    )
      throw Error("invalid file");

      // On verifie si la taille de l'image est correct
    if (req.file.size > 1000000) throw Error("max size");
  } catch (err) {
    const errors = uploadErrors(err);
    return res.status(500).json({ errors });
  }
  // On recupère le nom du fichier dans le body et qu'on met en jpg dans tous les cas
  const fileName = req.body.name + ".jpg";

  await pipeline(
    req.file.stream,
    // On lui passe le chemin pour créer le fichier et/ou le stocker
    fs.createWriteStream(
      // Il va créer un fichier directement en ecrasant l'ancien qui a le meme nom
      `${__dirname}/../client/public/uploads/profil/${fileName}`
    )
  );

  // On va mettre le chemin dans la bdd
  try {
    
    await UserModel.findByIdAndUpdate(
      // On recupere l'user avec son id qu'on a passé en param
      req.body.userId,
      // on remplace le chemin avec le nom du fichier actuel
      { $set : {picture: "./uploads/profil/" + fileName}},
      { new: true, upsert: true, setDefaultsOnInsert: true},
      (err, docs) => {
        if (!err) return res.send(docs);
        else return res.status(500).send({ message: err });
      }
    );
  } catch (err) {
    return res.status(500).send({ message: err });
  }
};
