import { setupServer } from 'msw/node';
import {
    render,
    configure,
    screen,
    waitFor,
    waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Root from './App';
import { handlers } from './handlers';

configure({
    asyncUtilTimeout: 5000,
});

const server = setupServer(...handlers);

beforeAll(() => {
    server.listen();
});

jest.setTimeout(20000);

test('should not reuse cache when fetchPolicy is set to network only, seems to be cause by nextFetchPolicy', async () => {
    render(<Root></Root>);

    userEvent.click(screen.getByRole('button', { name: /contact1/i }));
    await screen.findByText('data 1');

    userEvent.click(screen.getByRole('button', { name: /contact2/i }));
    await screen.findByText('data 2');

    // this seems to be necessary to trigger the behavior
    userEvent.click(screen.getByRole('button', { name: /unload/i }));

    userEvent.click(screen.getByRole('button', { name: /contact1/i }));

    // loading is shown very briefly before showing the cached data...
    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
    expect(screen.queryByText('data 2')).not.toBeInTheDocument();
});
