import './check-npm.js';

import { createNetworkInterface } from 'apollo-client';
import { Accounts } from 'meteor/accounts-base';
import { _ } from 'meteor/underscore';
import { print } from 'graphql-tag/printer';
import { Client } from 'subscriptions-transport-ws';

const defaultNetworkInterfaceConfig = {
  path: '/graphql',
  options: {},
  useMeteorAccounts: true,
  useSubscription: true,
};

const getDefaultWsClient = () => new Client('ws://localhost:8080');

export const createMeteorNetworkInterface = (givenConfig) => {
  const config = _.extend(defaultNetworkInterfaceConfig, givenConfig);
  const wsClient = givenConfig && givenConfig.wsClient ? givenConfig.wsClient : getDefaultWsClient();
  // absoluteUrl adds a '/', so let's remove it first
  let path = config.path;
  if (path[0] === '/') {
    path = path.slice(1);
  }

  // For SSR
  const uri = Meteor.absoluteUrl(path);
  const networkInterface = createNetworkInterface({ uri });

  if (config.useMeteorAccounts) {
    networkInterface.use([{
      applyMiddleware(request, next) {
        const currentUserToken = Accounts._storedLoginToken() ? Accounts._storedLoginToken() : null;

        if (!currentUserToken) {
          next();
          return;
        }

        if (!request.options.headers) {
          request.options.headers = new Headers();
        }

        request.options.headers.Authorization = currentUserToken;

        next();
      },
    }]);
  }

  if (config.useSubscription) {
    return _.extend(networkInterface, {
      subscribe: (request, handler) => wsClient.subscribe({
        query: print(request.query),
        variables: request.variables,
      }, handler),
      unsubscribe: (id) => {
        wsClient.unsubscribe(id);
      },
    });
  }
  return networkInterface;
};
// const configureSubscription = (wsClientProvided) => {
//   const wsClient = wsClientProvided ? wsClientProvided : getDefaultWsClient();
//   return {
//     subscribe: (request, handler) => wsClient.subscribe({
//       query: print(request.query),
//       variables: request.variables,
//     }, handler),
//     unsubscribe: (id) => {
//       wsClient.unsubscribe(id);
//     },
//   };
// }
export const meteorClientConfig = (networkInterfaceConfig) => {
  const networkInterface = createMeteorNetworkInterface(networkInterfaceConfig);
  let { initialState } = networkInterface;
  if(initialState){
    // Temporary workaround for bug in AC@0.5.0: https://github.com/apollostack/apollo-client/issues/845
    delete initialState.apollo.queries;
    delete initialState.apollo.mutations;
  }

  return {
    networkInterface,
    initialState,
    // Default to using Mongo _id, must use _id for queries.
    dataIdFromObject: (result) => {
      if (result._id && result.__typename) {
        const dataId = result.__typename + result._id;
        return dataId;
      }
      return null;
    },
  };
};
