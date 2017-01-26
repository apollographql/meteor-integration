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
