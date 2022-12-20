import { ApolloClient, gql, useQuery, InMemoryCache, ApolloProvider } from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { setupServer } from 'msw/node';
import { render, configure, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { useState } from 'react';

configure({
    asyncUtilTimeout: 5000,
});

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

const useData = ({ contactId }: any) => {
    const res = useQuery(QUERY_1, {
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'cache-first',
        variables: {
            contactId,
            limit: 50,
        },
    });

    return res;
};

const ConversationHistory = ({ contactId }: any) => {
    const { error, data, loading } = useData({ contactId });

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

const server = setupServer();

beforeAll(() => {
    server.listen();
});

const Root = ({ apolloClient }: any) => (
    <ApolloProvider client={apolloClient}>
        <App />
    </ApolloProvider>
);

jest.setTimeout(20000);

test('should not reuse cache when fetchPolicy is set to network only, seems to be cause by nextFetchPolicy', async () => {
    const apolloClient = new ApolloClient({
        link: new BatchHttpLink({
            uri: '/graphql',
        }),
        cache: new InMemoryCache(),
    });

    server.use(
        rest.post('/graphql', async (req: any, res, ctx) => {
            const id = req.body[0].variables.contactId;
            console.log('server hit');

            if (id === 'contact1') {
                return res(
                    ctx.delay(1500),
                    ctx.json({
                        data: {
                            conversationHistory: {
                                conversations: [
                                    {
                                        id: '1',
                                        content: 'blabla',
                                        testProp: true,
                                        __typename: 'Conversation',
                                    },
                                ],
                                __typename: 'ConversationHistory',
                            },
                        },
                    })
                );
            }

            if (id === 'contact2') {
                return res(
                    ctx.delay(1500),
                    ctx.json({
                        data: {
                            conversationHistory: {
                                conversations: [
                                    {
                                        id: '1',
                                        content: 'nonono',
                                        testProp: false,
                                        __typename: 'Conversation',
                                    },
                                ],
                                __typename: 'ConversationHistory',
                            },
                        },
                    })
                );
            }
        })
    );

    render(<Root apolloClient={apolloClient}></Root>);

    userEvent.click(screen.getByRole('button', { name: /contact1/i }));
    await screen.findByText('blabla');

    userEvent.click(screen.getByRole('button', { name: /contact2/i }));
    await screen.findByText('nonono');

    // this seems to be necessary to trigger the behavior
    userEvent.click(screen.getByRole('button', { name: /unload/i }));

    userEvent.click(screen.getByRole('button', { name: /contact1/i }));
    // should not find this text as it is part of contact2 data, but it does...
    await expect(screen.findByText('nonono')).rejects.toBeDefined();

    // it will show the data for contact one after showing the cached data for a while.
});
