import { ApolloClient, gql, useQuery, InMemoryCache, ApolloProvider } from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { setupWorker } from 'msw';
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

const useData = ({contactId}: any) => {
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

export const server = setupWorker(
  rest.post('/graphql', async (req: any, res, ctx) => {
    const id = req.body[0].variables.contactId;
    console.log('server hit')

    if (id === 'contact1') {
        return res(ctx.delay(2500), ctx.json({
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
        return res(ctx.delay(2500), ctx.json({
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



    

    

    


    

    



function Root() {
  return (
    <ApolloProvider client={apolloClient}><App /></ApolloProvider>
  );
}

export default Root;
