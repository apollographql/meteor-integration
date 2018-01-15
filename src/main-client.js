import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

export const meteorAccountsLink = new ApolloLink((operation, forward) => {
  const token = Accounts._storedLoginToken();

  operation.setContext(() => ({
    headers: {
      'meteor-login-token': token,
    },
  }));

  return forward(operation);
});

export const createApolloClient = ({ link, cache } = {}) =>
  new ApolloClient({
    link: link || meteorAccountsLink.concat(new HttpLink({ uri: Meteor.absoluteUrl('graphql') })),
    cache: cache || new InMemoryCache(),
  });

export const createMeteorNetworkInterface = () => {
  throw new Error(
    '`createMeteorNetworkInterface()` is from v1 of this package. The API has changed to `createApolloClient()`.'
  );
};

export const meteorClientConfig = () => {
  throw new Error(
    '`meteorClientConfig()` is from v1 of this package. The API has changed to `createApolloClient()`.'
  );
};

export const getMeteorLoginToken = () => {
  throw new Error(
    '`getMeteorLoginToken` is from v1 of this package. Use `createApolloClient` or `meteorAccountsLink`.'
  );
};