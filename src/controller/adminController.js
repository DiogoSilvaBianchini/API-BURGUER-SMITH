const bcryptjs = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { encryptedPassword } = require("../middlewares/userMiddlewares")
const mailerConfig = require("../config/nodeMailerConfig")

const Service = require("../services/Services")
const recoverModel = require("../database/mongoDB/model/recoverSchema")
const service = new Service("admin")

class UserController{
    static async getAllUsers(req,res,next){
        try {
            const users = await service.findAll({attributes: {exclude: ["password"]}})
            return res.status(200).json({results: users, status: 200}) 
        } catch (error) {
            next(error)
        }
    }

    static async getUserById(req,res,next){
        const {id} = req.params
        try {
            const user = await service.findById(id)
            return res.status(200).json({results: user, status: 200})
        } catch (error) {
            
        }
    }

    static async createToken (payload, req,res,next){
        try {
            const { expire } = req.body
            let duration = {}
            
            if(expire) return duration = {expiresIn: "12h"}

            const token = await jwt.sign(payload, process.env.SECRET_TOKEN, {expiresIn: "12h"})
            return res.status(200).json({results: token, status: 200})
        } catch (error) {
            next(error)   
        }
    }

    static async createRecoverToken (payload, req, res, next){
        try {
            const token = await jwt.sign(payload, process.env.SECRET_TOKEN_RECOVER, {expiresIn: "30m"})
            return res.status(200).json({results: token, status: 200})
        } catch (error) {
            next(error)   
        }
    }

    static async createNewUser(req, res, next){
        const {name, email, password} = req.body

        try {
            const hash = await encryptedPassword(password)
            await service.createNewRegister({name, email, password: hash})
            return res.status(201).json({results: "Usuario criado com sucesso", status: 201})
        } catch (error) {
            if(error.message.includes("Validation error")){
                return res.status(301).json({results: "E-mail já registrado", status: 301})
            }
            next(error)
        }
    }

    static async deleteUserById(req,res,next){
        try {
            const token = req.headers.authorization
            await service.removeById(token)
            return res.status(201).json({message: "Usuario removido com sucesso", status: 201})
        } catch (error) {
            next(error)
        }
    }

    static async generateCodeRecover(payload, req, res, next){        
        try {
            const code = Math.floor(Math.random() * 1E6)
            const salt = await bcryptjs.genSalt(10)
            const hash = await bcryptjs.hash(`${process.env.SECRET_CODE}-${code}`, salt)

            await recoverModel.create({
                userId: payload.id,
                recoveryPass: hash 
            })

            await mailerConfig.sendMail({
                from: process.env.SMTP_MAIL,
                to:  payload.email,
                subject: "Recuperação de seja Burguer Smith",
                text: `Código de acesso: ${code}`
            })
            
            next(payload)
        } catch (error) {
           next(error) 
        }
    }

    static async checkEmail(req,res,next){
        const {email} = req.body
        try {
            const findEmail = await service.findOne({where: {email}})

            if(findEmail){
                const payload = {id: findEmail.id, email: findEmail.email}
                next(payload)
            }else{
                return res.status(400).json({msg: "Email não encontrado", results: [], status: 400})
            }
        } catch (error) {
            next(error)
        }
    }

    static async confirmeCode(payload, req, res, next){
        const { code } = req.body

        try {
            const findCode = await recoverModel.findOne({userId: payload.id})

            if(!findCode || !findCode.status){
                return res.status(410).json({msg: "Código expirou", results: false, status: 410})
            }

            const isCodeValid  = await bcryptjs.compare(`${process.env.SECRET_CODE}-${code}`, findCode.recoveryPass)
            
            if(!isCodeValid ){
                if(findCode.attempts >= 3){
                    await recoverModel.findOneAndDelete({userId: payload.id})
                    return res.status(429).json({msg: "Muitas tentátivas foram feitas, tente novamente em 5 minutos", results: false, status: 429})
                }

                await recoverModel.findOneAndUpdate(
                    {userId: payload.id}, {
                    $inc: {attempts: 1}
                })

                return res.status(401).json({msg: "Código incorreto", results: false, status: 401})
            }
            
            return res.status(200).json({msg: "Código incorreto", results: true, status: 200})
        } catch (error) {
            next(error)
        }
    }

    static async updatePassword(id, req, res, next){
        const {password} = req.body
        try {
            const salt = await bcryptjs.genSalt(10)
            const hash = await bcryptjs.hash(password, salt)

            await service.updateById(id, {
                where: {
                    password: hash
                }
            })

            return res.status(200).json({msg: "Senha atualizada com sucesso", status: 200, results: true})
        } catch (error) {
            next(error)
        }
    }

    static async updateUser(token, req, res, next){
        const {email, password} = req.body
        const payload = {}

        if(email){
            payload.email = email
        }
        if(password){
            const salt = await bcryptjs.genSalt(10)
            const hash = await bcryptjs.hash(password, salt)
            payload.password = hash
        }

        if(Object.keys(payload).length == 0){
            return res.status(401).json({results: "Dados inválidos", status: 401})
        }

        try {
            const update = await service.updateById(token.id, payload)
            if(update == 0){
                return res.status(401).json({results: "Usuario não existe", status: 401})
            }else{
                return res.status(201).json({results: "Dados atualizados com sucesso!", status: 201})
            }
        } catch (error) {
            next(error)
        }
    }
}

module.exports = UserController