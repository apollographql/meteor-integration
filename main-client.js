import './check-npm.js';

import { createNetworkInterface, createBatchingNetworkInterface } from 'apollo-client';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';

const defaultNetworkInterfaceConfig = {
  path: '/graphql', // default graphql server endpoint
  opts: {}, // additional fetch options like `credentials` or `headers`
  useMeteorAccounts: true, // if true, send an eventual Meteor login token to identify the current user with every request
  batchingInterface: true, // use a BatchingNetworkInterface by default instead of a NetworkInterface
  batchInterval: 10, // default batch interval
};

export const createMeteorNetworkInterface = (givenConfig) => {
  const config = _.extend(defaultNetworkInterfaceConfig, givenConfig);

  // absoluteUrl adds a '/', so let's remove it first
  let path = config.path;
  if (path[0] === '/') {
    path = path.slice(1);
  }

  // allow the use of a batching network interface; if the options.batchingInterface is not specified, fallback to the standard network interface
  const interfaceToUse = config.batchingInterface ? createBatchingNetworkInterface : createNetworkInterface;

  // default interface options
  let interfaceOptions = {
    uri: Meteor.absoluteUrl(path),
  };

  // if a BatchingNetworkInterface is used with a correct batch interval, add it to the options
  if(config.batchingInterface && config.batchInterval) {
    interfaceOptions.batchInterval = config.batchInterval;
  }

  // if 'fetch' has been configured to be called with specific opts, add it to the options
  if(!_.isEmpty(config.opts)) {
    interfaceOptions.opts = config.opts;
  }

  const networkInterface = interfaceToUse(interfaceOptions);

  if (config.useMeteorAccounts) {
    // possible cookie login token created by meteorhacks:fast-render 
    // and passed to the Apollo Client during server-side rendering
    const { loginToken } = config;

    if (Meteor.isClient && loginToken) {
      // note: as it's not possible to stop a request,
      // should this be handled somehow server-side?
      console.error('[Meteor Apollo Integration] The current user is not handled with your GraphQL requests: you are trying to pass a login token to an Apollo Client instance defined client-side. This is only allowed during server-side rendering, please check your implementation.');
    } else {
      networkInterface.use([{
        applyMiddleware(request, next) {
          
          // Meteor accounts-base login token stored in local storage,
          // only exists client-side as of Meteor 1.4, will exist with Meteor 1.5
          const localStorageLoginToken = Meteor.isClient && Accounts._storedLoginToken();
          
          // define a current user token if existing 
          // ex: passed during server-side rendering or grabbed from local storage
          let currentUserToken = localStorageLoginToken || loginToken;
          
          if (!currentUserToken) {
            next();
            return;
          }
          
          if (!request.options.headers) {
            // Create the header object if needed.
            request.options.headers = new Headers();
          }

          request.options.headers.Authorization = currentUserToken;
          
          next();
        },
      }]);
    }
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
