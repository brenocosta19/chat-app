import bcryptjs, { compare } from "bcryptjs"
import User from "../models/user.model.js"
import { generateToken } from "../lib/utils.js"
import cloudinary from "../lib/cloudinary.js"

export const signup = async (req, res) => {
    const {email, fullName, password} = req.body
    try {

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Preencha todos os campos"})
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Senha deve conter 6 digitos"})
        }
        
        const user = await User.findOne({email})

        if (user) return res.status(400).json({ message: "Email já cadastrado" })

        const salt = await bcryptjs.genSalt(10)

        const hashedPassword = await bcryptjs.hash(password, salt)

        const newUser = new User({
            fullName: fullName,
            email: email,
            password: hashedPassword,
        })

        if(newUser) {
            generateToken(newUser._id, res)
            await newUser.save()

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            })
        } else {
            res.status(400).json({ message: "Invalid user data" })
        }
    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body
    try {
        const user = await User.findOne({email})

        if(!user) {
            return res.status(400).json({ message: "Credenciais Inválidas"})

        }

        const isPasswordCorrect = await bcryptjs.compare(password, user.password)

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Credenciais inválidas"})
        }

        generateToken(user._id, res)

        res.status(200).json({
            _id:user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        })
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", {maxAge: 0})
        res.status(200).json({ message: "Deslogado com sucesso"})
    } catch (error) {
        console.log("Erro no logout controller", error.message)
    }
}

export const updateProfile = async (req, res) => {
    try {
        const {profilePic} = req.body

        const userId = req.user._id

        if(!profilePic) {
            return res.status(400).json({ message: "Foto de Perfil é necessária"})
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic)

        const updatedUser = await User.findByIdAndUpdate(userId, {profilePic:uploadResponse.secure_url}, {new:true})

        res.status(200).json(updatedUser)
    } catch (error) {
        console.log("Erro em atualizar o perfil: ", error)
        res.status(500).json({ message: "Internal server error" })
    }
}

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user)
    } catch (error) {
        console.log("Erro em checkAuth controller", error.message)
        res.status(500).json({ message: "Internal Server Error"})
    }
}