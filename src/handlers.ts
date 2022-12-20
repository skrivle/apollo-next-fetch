import { rest } from 'msw';

export const handlers = [
    rest.post('/graphql', async (req: any, res, ctx) => {
        const id = req.body[0].variables.contactId;

        if (id === 'contact1') {
            return res(
                ctx.delay(2500),
                ctx.json({
                    data: {
                        conversationHistory: {
                            conversations: [
                                {
                                    id: '1',
                                    content: 'data 1',
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
                ctx.delay(2500),
                ctx.json({
                    data: {
                        conversationHistory: {
                            conversations: [
                                {
                                    id: '1',
                                    content: 'data 2',
                                    __typename: 'Conversation',
                                },
                            ],
                            __typename: 'ConversationHistory',
                        },
                    },
                })
            );
        }
    }),
];
