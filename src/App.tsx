import { ApolloClient, gql, useQuery, InMemoryCache, ApolloProvider } from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { useState } from 'react';

const QUERY_1 = gql`
    query ConversationHistory($contactId: ID!, $limit: Int!) {
        conversationHistory(contactId: $contactId, limit: $limit) {
            conversations {
                id
                content
            }
        }
    }
`;

const ConversationHistory = ({ contactId }: any) => {
    const { error, data, loading } = useQuery(QUERY_1, {
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'cache-first', // comment this line to make the test pass
        variables: {
            contactId,
            limit: 50,
        },
    });

    if (error) {
        return <div>error</div>;
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            {data.conversationHistory.conversations.map((c: any) => (
                <div key={c.id}>{c.content}</div>
            ))}
        </>
    );
};

const App = () => {
    const [selectedContact, setSelectedContact] = useState<null | string>(null);

    return (
        <div>
            <button onClick={() => setSelectedContact('contact1')}>contact1</button>
            <button onClick={() => setSelectedContact('contact2')}>contact2</button>
            <button onClick={() => setSelectedContact(null)}>unload</button>

            {selectedContact && <ConversationHistory contactId={selectedContact} />}
        </div>
    );
};

const apolloClient = new ApolloClient({
    link: new BatchHttpLink({
        uri: '/graphql',
    }),
    cache: new InMemoryCache(),
});

function Root() {
    return (
        <ApolloProvider client={apolloClient}>
            <App />
        </ApolloProvider>
    );
}

export default Root;
