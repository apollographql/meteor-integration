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

export const createApolloClient = ({ link, cache }) =>
  new ApolloClient({
    link: link || authLink.concat(new HttpLink({ uri: Meteor.absoluteUrl('graphql') })),
    cache: cache || new InMemoryCache(),
  });

export const createMeteorNetworkInterface = () => {
  throw new Error(
    'We are glad you use the Meteor Accounts integration with Apollo, however Apollo do not support anymore `createNetworkInterface`. Please update to Apollo Client 2.0 by using the new method `createApolloClient` or revert this package to version 1.0'
  );
};

export const meteorClientConfig = () => {
  throw new Error(
    'We are glad you use the Meteor Accounts integration with Apollo, however Apollo do not support anymore `createNetworkInterface`. Please update to Apollo Client 2.0 by using the new method `createApolloClient` or revert this package to version 1.0'
  );
};

export const getMeteorLoginToken = () => {
  throw new Error(
    'We are glad you use the Meteor Accounts integration with Apollo, however Apollo do not support anymore `createNetworkInterface`. Please update to Apollo Client 2.0 by using the new method `createApolloClient` or revert this package to version 1.0'
  );
};
