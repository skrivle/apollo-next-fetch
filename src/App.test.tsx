import { ApolloClient, gql, useQuery, InMemoryCache, ApolloProvider } from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { setupServer } from 'msw/node';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
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

const useData = ({contactId}:any) => {
    const res = useQuery(QUERY_1, {
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'cache-first',
        variables: {
            contactId,
            limit: 50
        }
    });

    return res;
}

const ConversationHistory = ({contactId}: any) => {
    
    const {error, data, loading} = useData({contactId});
    
    if (error) {
        return <div>error</div>   
    }

    if (loading) {
        return <div>Loading...</div>
    }

    

    console.log(data.conversationHistory.conversations)
    

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
    )
}

const server = setupServer();

beforeAll(() => {
  server.listen();
});

test('Should execute refetchQueries', async () => {

    const apolloClient = new ApolloClient({
      link: new BatchHttpLink({
        uri: '/graphql',
      }),
      cache: new InMemoryCache({
        // typePolicies: {
        //     Query: {
        //         fields: {
        //             conversationHistory: {
        //                 keyArgs: ['contactId']
        //             }
        //         }
        //     },
        //     Conversation: {
        //         fields: {
        //             content: {merge: true}
        //         }
        //     }
        // }
      }),
    });



    server.use(
        rest.post('/graphql', async (req: any, res, ctx) => {
            const id = req.body[0].variables.contactId;
            console.log('server hit')

            if (id === 'contact1') {
                return res(ctx.delay(500), ctx.json({
                    data: {
                        conversationHistory: {
                            conversations: [
                                {id: '1', content: 'blabla', testProp: true, __typename: "Conversation"}
                            ],
                            __typename: "ConversationHistory",
                        }
                }}));
            }

            if (id === 'contact2') {
                return res(ctx.delay(500), ctx.json({
                    data: {
                        conversationHistory: {
                            conversations: [
                                {id: '1', content: 'nonono', testProp: false, __typename: "Conversation"}
                            ],
                            __typename: "ConversationHistory",
                        }
                }}));
            }

        })
    );

    render(<ApolloProvider client={apolloClient}><App /></ApolloProvider>);

    userEvent.click(screen.getByRole('button', {name: /contact1/i}));

    await screen.findByText('blabla');

    



    userEvent.click(screen.getByRole('button', {name: /contact2/i}));
    await screen.findByText('nonono');
    
    userEvent.click(screen.getByRole('button', {name: /unload/i}));

    expect(screen.queryByText('nonono')).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', {name: /contact1/i}));

    expect(screen.queryByText('nonono')).not.toBeInTheDocument();

    // await screen.findByText('blabla');

    

    
});
