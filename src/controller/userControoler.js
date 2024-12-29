const { v4 } = require("uuid")
const Service = require("../services/Services")
const updateBodyCreator = require("../utils/updateBodyCreator")
const userModel = new Service("user")
const jwt = require("jsonwebtoken")


const createToken = async (payload) => {
    try {
        const token = await jwt.sign(payload, process.env.CLIENT_SECRET_KEY)
        return token
    } catch (error) {
        throw new Error
    }
}

class UserController{
    static async getAllUsers(req,res,next){
        try {
            const search = await userModel.findAll()
            return res.status(200).json({msg: "Todos os usuarios registrados", results: search, status: 200})
        } catch (error) {
            next(error)
        }
    }

    static async getUserByToken(req,res,next){
        try {
            const {authorization} = req.headers
            const { user } = jwt.decode(authorization)
            const findUser = await userModel.findById(user, {attributes: {exclude: ["createdAt", "updatedAt", "buy_list"]}})
            
            if(findUser){
                return res.status(200).json({msg: "Usuario encontrado com sucesso!", results: {user: findUser}, status: 200})
            }else{
                return res.status(200).json({msg: "Usuario não encontrado", results: false, status: 200})
            }

        } catch (error) {
            next(error)
        }
    }

    static async getUserById(req,res,next){
        const {id} = req.params
        try {
            const searchUser = await userModel.findById(id)
            if(!searchUser){
                return res.status(401).json({msg: "Usuario não existe", results: false, status: 401})
            }

            return res.status(200).json({msg: "Usuario encontado com sucesso", results: searchUser, status: 200})
        } catch (error) {
            next(error)
        }
    }

    static async validateUserByEmail(req,res,next){
        const {email} = req.body
        try {
            const search = await userModel.findOne({where: {email}})
            
            if(!search){
                return res.status(401).json({msg: "Usuario não encontrado", results: false, status: 401})
            }

            const token = await createToken({user: search.id})
            return res.status(200).json({msg: "Usuario encontrado com sucesso!", results: {token: token}, status: 200})
        } catch (error) {
            
        }
    }

    static async validateToken(req,res,next){
        try {
            const token = req.headers.authorization

            const validate = await jwt.verify(token, process.env.CLIENT_SECRET_KEY)
            if(!validate) return res.status(401).json({msg: "Token inválido", results: false, status: 401})

            const {user} = await jwt.decode(token)
            
            const searchUser = await userModel.findById(user, {attributes: ["id"]})
            if(searchUser){
                return res.status(200).json({msg: "Usuario encontrado com sucesso!", results: true, status: 200})
            }else{
                return res.status(401).json({msg: "Usuario não encontrado!", results: false, status: 401})
            }
        } catch (error) {
            console.log(error.message)
            if(error.message.includes("jwt malformed")){
                return res.status(401).json({msg: "token inválido", results: false, status: 401})
            }else{
                next(error)
            }
        }
    }

    static async createNewUser(req,res,next){
        try {
            const {name, email, phone, cep, numberHouse } = req.body
            await userModel.createNewRegister({name, email, phone, cep, number_house:numberHouse})

            const token = await jwt.sign({email}, process.env.CLIENT_SECRET_KEY)

            return res.status(201).json({msg: "Usuario criado com sucesso", results: token, status: 201})
        } catch (error) {
            next(error)
        }
    }

    static async updateUser(req,res,next){
        try {
            const {id} = req.params
            const payload = updateBodyCreator(req.body)

            await userModel.updateById(id, payload)

            const newUser = await userModel.findById(id)

            return res.status(201).json({msg: "Usuario atualizado com sucesso.", results: newUser, status: 201})
        } catch (error) {
            next(error)
        }
    }

    static async deleteUser(req,res,next){
        try {
            const {id} = req.params

            const user = await userModel.findById(id)
            if(user){
                await userModel.removeById(id)
                return res.status(201).json({msg: "Usuario removido com sucesso!", resutls: user, status: 200})
            }
            return res.status(201).json({msg: "Usuario não existe", resutls: false, status: 200})
        } catch (error) {
            next(error)
        }
    }
}

module.exports = UserController