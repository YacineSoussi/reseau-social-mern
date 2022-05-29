module.exports.signUpErrors = (err) => {
  // on instancie errors.pseudo, errors.email et errors.password vide
    let errors = { pseudo: "", email: "", password: "" };
  
    // Si dans l'erreur il y'a un cas de reponse avec pseudo on rempli la propriété pseudo
    if (err.message.includes("pseudo"))
      errors.pseudo = "Pseudo incorrect ou déjà pris";
  // Si dans l'erreur il y'a un cas de reponse avec email on rempli la propriété email
    if (err.message.includes("email")) errors.email = "Email incorrect";
  // Si dans l'erreur il y'a un cas de reponse avec password on rempli la propriété password
    if (err.message.includes("password"))
      errors.password = "Le mot de passe doit faire 6 caractères minium";
  // Si l'erreur est un code 11000 et que le premier élément de l'object keyValue de la reponse soit pseudo
    if (err.code === 11000 && Object.keys(err.keyValue)[0].includes("pseudo"))
      errors.pseudo = "Ce pseudo est déjà pris";
  // Si l'erreur est un code 11000 et que le premier élément de l'object keyValue de la reponse soit email
    if (err.code === 11000 && Object.keys(err.keyValue)[0].includes("email"))
      errors.email = "Cet email est déjà enregistré";
  
      // on retourne l'objet errors 
    return errors;
  };
  
  module.exports.signInErrors = (err) => {
    let errors = { email: '', password: ''}
  
    if (err.message.includes("email")) 
      errors.email = "Email inconnu";
    
    if (err.message.includes('password'))
      errors.password = "Le mot de passe ne correspond pas"
  
    return errors;
  }

  module.exports.uploadErrors = (err) => {
    let errors = { format: '', maxSize: ""};
  
    if (err.message.includes('invalid file'))
      errors.format = "Format incompatabile";
  
    if (err.message.includes('max size'))
      errors.maxSize = "Le fichier dépasse 1mo";
  
    return errors
  }