const mongoose = require("mongoose");

mongoose
.connect("mongodb+srv://" + process.env.db_user_pass + "@cluster0.cxkxv.mongodb.net/reseau-social",
{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
})
.then(() => {
    console.log('Connecté à la base de données')
})
.catch((err) => {
    console.log('Echec de la connexion à la base de données', err);
})