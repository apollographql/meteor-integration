import './check-npm.js';

import { createNetworkInterface } from 'apollo-client';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';

const defaultNetworkInterfaceConfig = {
  path: '/graphql',
  options: {},
  useMeteorAccounts: true
};

export const createMeteorNetworkInterface = (givenConfig) => {
  const config = _.extend(defaultNetworkInterfaceConfig, givenConfig);

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
        
        // cookie login token created by meteorhacks:fast-render and caught during server-side rendering by rr:react-router-ssr
        const { loginToken: cookieLoginToken } = config;
        // Meteor accounts-base login token stored in local storage, only exists client-side
        const localStorageLoginToken = Meteor.isClient && Accounts._storedLoginToken();
        
        // on initial load, prefer to use the token grabbed server-side if existing
        let currentUserToken = cookieLoginToken || localStorageLoginToken;

        // ...a login token has been passed to the config, however the "true" one is different ⚠️
        // https://github.com/apollostack/meteor-integration/pull/57/files#r96745502
        if (Meteor.isClient && cookieLoginToken && cookieLoginToken !== localStorageLoginToken) {
          // be sure to pass the right token to the request!
          currentUserToken = localStorageLoginToken; 
        }

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

  return networkInterface;
};

export const meteorClientConfig = (networkInterfaceConfig) => {
  return {
    ssrMode: Meteor.isServer,
    networkInterface: createMeteorNetworkInterface(networkInterfaceConfig),

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
