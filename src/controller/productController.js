const Services = require("../services/Services")
const services = new Services("Product")
const stripe = require("stripe")(process.env.GETWAY_SECRET_KEY)
const checkCep = require("../utils/checkCep")
const removeImgByKey = require("../utils/removeImgByKey")
const db = require("../database/postgress/models/index")
const {queryNumber, queryRegexList} = require("../utils/queryBuilder")
const { Op } = require("sequelize")
const shippingPrice = require("../utils/shippingPrice")

const populateCategory = {
    include: {
        model: db.Category,
        attributes: ["name"]
    }
}

const agreeNewImages = async (id, newImgs) => {
    try {
        const product = await services.findById(id)
        const newListImgs = product.imgs
        console.log(product, newListImgs, newImgs)
        for(let img of newImgs){
            newListImgs.push(img.key)
        }
        return newListImgs
    } catch (error) {
        removeImgByKey(newImgs)
        throw new Error(error)
    }
}

class ProductController{

    static async findByOrderTimer(req,res,next){
        try {
            const products = await services.findAll({
                order: [['createdAt', "DESC"]]
            })

            return res.status(200).json({results: products, status: 200})
        } catch (error) {
            next(error)
        }   
    }

    static async findForFilter(req,res,next){
        const {id, title, categoryId, category} = req.query
        try {
            const regexTitle = queryRegexList({title: title})
            const numberQuerys = queryNumber({id, categoryId})

            const query = {...regexTitle, ...numberQuerys}
            let populate = {
                include: {
                    model: db.Category,
                    attributes: ["name"]
                }
            }
            if(category){
                populate.include.where = {name: {[Op.iLike]: `%${category}%`}}
            }
            const product = await services.findAll({where: query, ...populate})

            return res.status(201).json({results: product, status: 201})
        } catch (error) {
            next(error)
        }
    }

    static async findAllProduct(req, res, next){
        try {
            const quarry = {
                attributes: ["id","title", "describe", "price", "categoryId", "ingredients", "imgs"],
                include: [
                    {
                        model: db.Category,
                        attributes: ["name"],
                    }
                ]
            }
            const products = await services.findAll(quarry)
            return res.status(200).json({results: products, status: 200})
        } catch (error) {
            next(error)
        }
    }

    static async createNewProduct(req,res,next){
        const imgName = req.files.map(file => file.filename)

        const {title, describe, price, categoryId, ingredients} = req.body
        
        try {
            const stripeProduct = await stripe.products.create({
                name: title,
                description: describe
            })

            const priceProduct = await stripe.prices.create({
                unit_amount: Math.floor(Number(price) * 100),
                currency: 'brl',
                product: stripeProduct.id
            })

            console.log(priceProduct.id)

            await services.createNewRegister({title, describe, price, ingredients: ingredients.split(','), categoryId: Number(categoryId), imgs: imgName, stripe_product_ID: stripeProduct.id, stripe_price_ID: priceProduct.id})

            return res.status(201).json({results: "Produto adicionado com sucesso", status: 201})
        } catch (error) {
            removeImageByKey(imgsKeyAws)
            next(error)
        }
    }

    static async updateProduct(req,res,next){
        const {title, describe, price, categoryId, ingredients} = req.body
        const imgs = req.files
        const {id} = req.params
        const payload = {}
        try {
            if(title){
                payload.title = title
            }

            if(describe){
                payload.describe = describe
            }

            if(price){
                payload.price = price
            }
            if(ingredients){
                const list = ingredients.split(",")
                payload.ingredients = list
            }
            if(categoryId){
                payload.categoryId = categoryId
            }
            if(imgs.length > 0){
                const newImgList = await agreeNewImages(id, imgs)
                payload.imgs = newImgList
            }

            if(Object.keys(payload).length > 0){
                console.log(payload)
                await services.updateById(id, payload)
                return res.status(201).json({results: "Produto atualizado com sucesso", status: 201})
            }else{
                return res.status(401).json({results: "Campo de Produto incorreto ou Nulo", status: 401})
            }
        } catch (error) {
            removeImgByKey(imgs)
            next(error) 
        }
    }

    static async removeProduct(req,res,next){
        const {id} = req.params
        try {
            const product = await services.findById(id)
            removeImgByKey(product.imgs)
            await services.removeById(id)
            return res.status(201).json({results: "Produto removido com sucesso!", status: 201})
        } catch (error) {
            next(error)
        }
    }

    static async removeImage(req,res,next){
        const {imgs, id} = req.body
        try {
            const product = await services.findById(Number(id))
            let newListImgs = product.imgs
            
            imgs.map(urlImg => {
                newListImgs = newListImgs.filter(img => img != urlImg)
            })

            await services.updateById(id, {imgs: newListImgs})

            await removeImgByKey(imgs)
            return res.status(201).json({results: "Imagem removida com sucesso!", status: 201})
        } catch (error) {
            next(error)
        }
    }

    static async payment(req,res,next){
        const {productList} = req.body
        try {
            const idList = productList.map(productList => productList.id)

            const findProducts = await services.findAll({
                attributes: ['id', 'stripe_price_ID'],
                where: {
                    id: {[Op.in]: idList}
                }
            })

            const items = findProducts.map(productQuerry => {
                const products = productList.filter(product => productQuerry.id == product.id)
                return {price: productQuerry.stripe_price_ID, quantity: products[0].quantity}
            })

            const session = await stripe.checkout.sessions.create({
                success_url: `${process.env.URL_FRONTEND_CLIENT}/PaymentConfirmed`,
                line_items: items,
                mode: 'payment'
            })

            return res.status(200).json({results: session.url, status: 200})
        } catch (error) {
            next(error)
        }
    }

    static async checkShipping(req, res, next){
        const {cep} = req.body
        try {
            const address = await shippingPrice(cep)
            return res.status(200).json({msg: "Endereço encontrado!", results: address, status: 200})
        } catch (error) {
            next(error)
        }
    }
}

module.exports = ProductController