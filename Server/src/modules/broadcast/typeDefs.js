
import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Broadcast {
    id: ID!
    faculty: User
    message: String!
    department: String
    targetSemester: String
    createdAt: String
  }

  extend type Query {
    broadcasts: [Broadcast]
  }

  extend type Mutation {
    sendBroadcast(message: String!, department: String, targetSemester: String): Broadcast
  }

  extend type Subscription {
    broadcastAdded: Broadcast
  }
`;
