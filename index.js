const {ApolloServer} = require('@apollo/server');
const {expressMiddleware} = require('@apollo/server/express4');
const {ApolloServerPluginDrainHttpServer} = require('@apollo/server/plugin/drainHttpServer');
const express = require('express');
const http = require('http');
const cors = require('cors');
const {sequelize} = require('./models');
const {resolvers, typeDefs} = require('./schema.js')

const main = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }


    const app = express();

    const httpServer = http.createServer(app);

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        plugins: [ApolloServerPluginDrainHttpServer({httpServer})],
    });

    await server.start();

    app.use(
        '/',
        cors(),
        express.json(),
        expressMiddleware(server, {
            context: async ({req}) => ({token: req.headers.token}),
        }),
    );


    await new Promise((resolve) => httpServer.listen({port: 3003}, resolve));

    console.log(`Server start at http://localhost:3003/`);
}

try {
    main()
} catch (e) {
    console.log("Server crashed!", e)
}