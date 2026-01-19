import { ApolloClient, InMemoryCache, createHttpLink, split, ApolloLink, from, TypePolicies } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';

const API_URL = import.meta.env.VITE_GRAPHQL_HTTP_URL || 'http://localhost:5000/graphql';
const WS_URL = import.meta.env.VITE_GRAPHQL_WS_URL || 'ws://localhost:5000/graphql';

// HTTP Link
const httpLink = createHttpLink({
    uri: API_URL,
});

// Error handling link
const errorLink = onError((error: any) => {
    const { graphQLErrors, networkError } = error;
    if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }: any) => {
            console.error(`[GraphQL Error]: Message: ${message}, Path: ${path}`);
        });
    }
    if (networkError) {
        console.error(`[Network Error]: ${networkError.message}`);
    }
});

// Auth link for HTTP requests
const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('ldce_auth_token');
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
        }
    };
});

// Create WebSocket client with reconnection logic
const wsClient = createClient({
    url: WS_URL,
    connectionParams: () => {
        const token = localStorage.getItem('ldce_auth_token');
        return {
            Authorization: token ? `Bearer ${token}` : "",
        };
    },
    // Retry configuration
    retryAttempts: 10,
    shouldRetry: () => true,
    // Handle connection events
    on: {
        connected: () => console.log('[WS] Connected'),
        closed: (event) => console.log('[WS] Closed', event),
        error: (error) => console.error('[WS] Error', error),
    },
    lazy: true,
});

const wsLink = new GraphQLWsLink(wsClient);

// Split operations between HTTP and WebSocket
const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        );
    },
    wsLink as unknown as ApolloLink,
    authLink.concat(httpLink)
);

// Complex Cache Policies
const typePolicies: TypePolicies = {
    Query: {
        fields: {
            faculties: {
                merge(existing, incoming) {
                    return incoming;
                },
            },
            broadcasts: {
                merge(existing, incoming) {
                    return incoming;
                }
            },
            myAppointments: {
                merge(existing, incoming) {
                    return incoming;
                }
            }
        },
    },
    Faculty: {
        keyFields: ['id'],
        fields: {
            availability: {
                merge(existing, incoming) {
                    return { ...existing, ...incoming };
                },
            },
            weeklySchedule: {
                merge(existing, incoming) {
                    return incoming;
                },
            },
            image: {
                read(existing) { return existing ?? null; }
            },
            department: {
                read(existing) { return existing ?? null; }
            },
            designation: {
                read(existing) { return existing ?? null; }
            }
        },
    },
    User: {
        keyFields: ['id'],
        fields: {
            image: {
                read(existing) { return existing ?? null; },
            },
            enrollmentNo: {
                read(existing) { return existing ?? null; },
            },
            department: {
                read(existing) { return existing ?? null; },
            },
        },
    },
    FacultyAvailability: {
        keyFields: false, // Embedded object
        merge(existing, incoming) {
            return { ...existing, ...incoming };
        },
    },
    WeeklySchedule: {
        keyFields: ['id'],
        merge(existing, incoming) {
            return incoming;
        },
    },
    DateOverride: {
        keyFields: false,
    }
};

const cache = new InMemoryCache({
    typePolicies
});

export const client = new ApolloClient({
    link: from([errorLink, splitLink]),
    cache,
    defaultOptions: {
        watchQuery: {
            // "cache-and-network" is the best for persistence + updates
            // It shows cached data instantly (persistence) and updates in background
            fetchPolicy: 'cache-and-network',
            errorPolicy: 'all',
        },
        query: {
            // queries (standard one-off) should also try cache first or cache-and-network
            fetchPolicy: 'cache-first',
            errorPolicy: 'all',
        },
        mutate: {
            errorPolicy: 'all',
        },
    },
});

// Export wsClient for manual control if needed
export { wsClient };
