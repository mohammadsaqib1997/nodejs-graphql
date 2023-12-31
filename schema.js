const {User} = require('./models')
const {hash} = require("bcrypt");
const bcrypt = require("bcrypt");
const {sign, verify} = require("jsonwebtoken");
const {createUserSchema, updateUserSchema} = require("./validations/userValidation");
const jobQueue = require('./jobQueue')

const secret = 'TestGraphQL123'

const verifyToken = ({token}) => {
    if (!token) return null;

    try {
        return verify(token, secret);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

const typeDefs = `#graphql
type User {
    id: ID!
    username: String!
    email: String!
    password: String!
}

type QueueJob {
    id: ID!
    data: String
    status: String
    result: String
}

type Query {
    users(page: Int, perPage: Int, sortBy: String): [User]
    getUser(id: ID!): User
    getJobs: [QueueJob]
}

type Mutation {
    createUser(username: String!, email: String!, password: String!): User
    updateUser(id: ID!, username: String, email: String, password: String): User
    deleteUser(id: ID!): User
    login(email: String!, password: String!): String
    createJob(data: String!): QueueJob
}
`;

const resolvers = {
    Query: {
        users: async (_, {page = 1, perPage = 10, sortBy = 'id'}) => {
            const offset = (page - 1) * perPage;
            const users = await User.findAll({
                offset,
                limit: perPage,
                order: [[sortBy, 'ASC']],
            });
            return users;
        },
        getUser: async (_, {id}) => await User.findByPk(id),
        getJobs: async (_, {}, context) => {
            const user = verifyToken(context)

            if (!user) {
                throw new Error('Authentication required');
            }

            try {
                const jobs = await jobQueue.getJobs(['completed', 'active', 'failed', 'waiting', 'paused', 'delayed'], 0, -1);

                const userJobs = jobs.filter((job) => {
                    return job.data?.user_id && job.data?.user_id === user.id
                });

                return userJobs.map((job) => ({
                    id: job.id,
                    data: JSON.stringify(job?.data?.user_data ?? ''),
                    status: job?.status ?? 'pending',
                    result: job?.result ?? '',
                }));
            } catch (e) {
                console.log(e)
                return null
            }
        }
    },
    Mutation: {
        createUser: async (_, args) => {
            const {password, email, username} = await createUserSchema.validateAsync(args);

            const hashedPassword = await hash(password, 10);

            try {
                const user = await User.create({
                    username,
                    email,
                    password: hashedPassword,
                });

                return user;
            } catch (error) {
                throw new Error('Failed to create user: ' + error.message);
            }
        },
        updateUser: async (_, {id, ...rest}, context) => {
            const user = verifyToken(context)

            if (!user) {
                throw new Error('Authentication required');
            }

            if (user.id !== parseInt(id)) {
                throw new Error('Permission denied');
            }

            const data = await updateUserSchema.validateAsync(rest, {context: {id}});

            if (data.hasOwnProperty('password'))
                data['password'] = await hash(data['password'], 10)

            const [updatedRows] = await User.update(data, {where: {id}});
            if (updatedRows > 0) return User.findByPk(id);
            return null;
        },
        deleteUser: async (_, {id}, context) => {
            const authUser = verifyToken(context)

            if (!authUser) {
                throw new Error('Authentication required');
            }

            if (authUser.id !== parseInt(id)) {
                throw new Error('Permission denied');
            }

            const user = await User.findByPk(id);
            if (user) {
                await user.destroy();
                return user;
            }
            return null;
        },
        login: async (_, {email, password}) => {
            const user = await User.findOne({where: {email}});

            if (!user || !bcrypt.compareSync(password, user.password)) {
                throw new Error('Invalid email or password');
            }

            const token = sign({id: user.id, email: user.email}, secret, {
                expiresIn: '1h',
            });

            return token;
        },
        createJob: async (_, {data}, context) => {
            const authUser = verifyToken(context)

            if (!authUser) {
                throw new Error('Authentication required');
            }

            const job = await jobQueue.add({
                user_data: data,
                user_id: authUser.id,
                status: "pending"
            });

            return {
                id: job.id,
                data,
                status: job.data.status,
                result: null
            }
        }
    }
}

module.exports = {typeDefs, resolvers}