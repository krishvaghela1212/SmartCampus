
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { typeDefs, resolvers } from './graphql/index.js';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import { checkAndNotify } from './modules/notification/service.js';

dotenv.config();

const startServer = async () => {
  const app = express();
  const httpServer = createServer(app);

  await connectDB();

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx, msg, args) => {
        // Get the token from connectionParams
        const { connectionParams } = ctx;
        const token = connectionParams?.Authorization?.split(' ')[1] || connectionParams?.authorization?.split(' ')[1];
        if (token) {
          try {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            return { user };
          } catch (err) {
            console.error("WS Token Verify Error:", err.message);
          }
        }
        return {};
      },
    },
    wsServer
  );

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  // Root route (for Render & browser check)
app.get("/", (req, res) => {
  res.status(200).json({
    message: "SmartCampus backend is running 🚀"
  });
});

// Health check (for monitoring)
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});


  app.use(
    '/graphql',
    cors({
  origin: [
    "http://localhost:3000",
    "https://smart-campus-alpha.vercel.app"
  ],
  credentials: true,
})
,
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization?.split(' ')[1] || '';
        try {
          if (token) {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            return { user };
          }
        } catch (e) {
          // Invalid token
        }
        return {};
      },
    }),
  );

  // Setup Notification Cron
  cron.schedule("*/2 * * * *", () => {
    checkAndNotify();
  });

  const PORT = process.env.PORT || 10000;
  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}/graphql`);
};

startServer();
