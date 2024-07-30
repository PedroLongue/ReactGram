const User = require("../models/User");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");

const jwtSecret = process.env.JWT_SECRET;

// Generate User Token
const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: "7d",
  });
};

// Register user and sign in
const register = async (req, res) => {
  const { name, email, password } = req.body;

  //check if user exists
  const user = await User.findOne({ email });

  if (user) {
    res.status(422).json({ errors: ["Por favor, utilize outro e-mail."] });

    return;
  }

  // Generate password hash
  const salt = await bcrypt.genSalt(); //gera string aleatória
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user
  const newUser = await User.create({
    name,
    email,
    password: passwordHash,
  });

  // If user was created successfully, return the token
  if (!newUser) {
    res
      .status(422)
      .json({ errors: ["Houve um erro, por favor tente mais tarde."] });

    return;
  }

  res.status(201).json({
    _id: newUser._id,
    token: generateToken(newUser._id),
  });
};

// Sign user in
const login = async (req, res) => {
  const { email, password } = req.body;

  //check if user exists
  const user = await User.findOne({ email });

  //check if user exists
  if (!user) {
    res.status(422).json({ errors: ["Usuário não encontrado."] });
  }

  //check if password matches
  if (!(await bcrypt.compare(password, user.password))) {
    res.status(422).json({ errors: ["Senha inválida."] });
    return;
  }

  //Return user with token
  res.status(201).json({
    _id: user._id,
    profileImage: user.profileImage,
    token: generateToken(user._id),
  });
};

//Get  curring logged in user
const getCurrentUser = async (req, res) => {
  const user = req.user;

  res.status(200).json(user);
};

//Update an user

const update = async (req, res) => {
  const { name, password, bio } = req.body;

  let profileImage = null;

  if (req.file) {
    profileImage = req.file.filename;
  }

  const reqUser = req.user;

  const user = await User.findById(
    new mongoose.Types.ObjectId(reqUser._id)
  ).select("-password");

  if (name) {
    user.name = name;
  }

  if (password) {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);
    user.password = passwordHash;
  }

  if (profileImage) {
    user.profileImage = profileImage;
  }

  if (bio) {
    user.bio = bio;
  }

  try {
    console.log("Saving user"); // Log para verificar se o usuário está sendo salvo
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error("Error saving user:", error); // Log para verificar se houve um erro ao salvar o usuário
    res.status(500).json({ errors: ["Erro ao atualizar usuário."] });
  }
};

//Get user by id
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select("-password");

    //check if user exists
    if (!user) {
      res.status(404).json({ errors: ["Usuário não encontrado"] });
  
      return;
    }
    res.status(200).json(user);
    
  } catch (error) {
    res.status(404).json({ errors: ["Usuário não encontrado"] });

    return;
  }
  
};

module.exports = {
  register,
  login,
  getCurrentUser,
  update,
  getUserById,
};
