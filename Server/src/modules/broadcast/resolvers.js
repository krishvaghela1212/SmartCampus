
import { getAllBroadcasts, createBroadcast } from './service.js';

import { pubsub } from '../../config/pubsub.js';

export const resolvers = {
    Broadcast: {
        faculty: (parent) => parent.facultyId,
        createdAt: (parent) => parent.createdAt.toISOString()
    },
    Query: {
        broadcasts: async () => await getAllBroadcasts()
    },
    Mutation: {
        sendBroadcast: async (_, { message, department, targetSemester }, context) => {
            if (!context.user || context.user.role !== 'FACULTY') {
                throw new Error('Unauthorized');
            }
            const newBroadcast = await createBroadcast(context.user.id, message, department, targetSemester);
            pubsub.publish('BROADCAST_ADDED', { broadcastAdded: newBroadcast });
            return newBroadcast;
        }
    },
    Subscription: {
        broadcastAdded: {
            subscribe: () => pubsub.asyncIterator(['BROADCAST_ADDED'])
        }
    }
};
