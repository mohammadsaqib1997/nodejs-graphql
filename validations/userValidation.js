const Joi = require('joi');
const {User} = require('../models')
const Sequelize = require('sequelize')
const Op = Sequelize.Op

const createUserSchema = Joi.object({
    username: Joi.string().min(3).max(30).required()
        .external(async (value, {message}) => {
            try {
                const existingUser = await User.findOne({where: {username: value}});

                if (existingUser) {
                    return message('Username is already in use');
                }

                return value;
            } catch (error) {
                return message('Internal server error');
            }
        }),
    email: Joi.string().email().required()
        .external(async (value, {message}) => {
            try {
                const existingUser = await User.findOne({where: {email: value}});

                if (existingUser) {
                    return message('Email is already in use');
                }

                return value;
            } catch (error) {
                return message('Internal server error');
            }
        }),
    password: Joi.string().min(6).required(),
});

const updateUserSchema = Joi.object({
    username: Joi.string().max(30)
        .external(async (value, {message, prefs}) => {
            if (value) {
                try {
                    const {id} = prefs.context
                    const existingUser = await User.findOne({where: {username: value, id: {[Op.ne]: id}}});

                    if (existingUser) {
                        return message('Username is already in use');
                    }

                    return value;
                } catch (error) {
                    return message('Internal server error');
                }
            }
            return value
        }),
    email: Joi.string().email()
        .external(async (value, {message, prefs}) => {
            if (value) {
                try {
                    const {id} = prefs.context
                    const existingUser = await User.findOne({where: {email: value, id: {[Op.ne]: id}}});

                    if (existingUser) {
                        return message('Email is already in use');
                    }

                    return value;
                } catch (error) {
                    return message('Internal server error');
                }
            }
            return value
        }),
    password: Joi.string().min(6),
});

module.exports = {
    createUserSchema,
    updateUserSchema
};