const {Joi} = require("express-validation")

const registerFormValidation = {
    body: Joi.object({
        title: 
            Joi.string()
            .required(),
        price: 
            Joi.string()
            .required(),
        describe: 
            Joi.string()
            .required(),
        categoryId: 
            Joi.number()
            .required(),
        token: [
            Joi.string()
            .required()
        ]
    })
}

module.exports = {
    registerFormValidation
}