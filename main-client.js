import './check-npm.js';

import { createNetworkInterface } from 'apollo-client';
import { addTypenameToSelectionSet } from 'apollo-client/queries/queryTransform';
import { Accounts } from 'meteor/accounts-base';
import { _ } from 'meteor/underscore';

const defaultNetworkInterfaceConfig = {
  path: '/graphql',
  options: {},
  useMeteorAccounts: true,
  // Pass a meteor accounts from another connection
  meteorAccounts: Accounts,
  // Pass a function if you save the user token in other location than accounts-base default
  getUserToken: null
};

const getUserToken = (config) => {
  if (config.getUserToken) {
    return config.getUserToken()
  } else {
    // if we don't defined a getUserToken function, we use accounts-base default
    return config.meteorAccounts._storedLoginToken()
  }
}

export const createMeteorNetworkInterface = (givenConfig) => {
  const config = _.extend(defaultNetworkInterfaceConfig, givenConfig);

  // absoluteUrl adds a '/', so let's remove it first
  let path = config.path;
  if (path[0] === '/') {
    path = path.slice(1);
  }

  // For SSR - Allows external meteor connections
  const url = path.includes('http') ? path : Meteor.absoluteUrl(path);
  const networkInterface = createNetworkInterface(url);

  if (config.useMeteorAccounts) {
    networkInterface.use([{
      applyMiddleware(request, next) {
        const currentUserToken = getUserToken(config);

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
    networkInterface: createMeteorNetworkInterface(networkInterfaceConfig),
    queryTransformer: addTypenameToSelectionSet,

    // Default to using Mongo _id, must use _id for queries.
    dataIdFromObject: (result) => {
      if (result._id && result.__typename) {
        const dataId = result.__typename + result._id;
        return dataId;
      }
    },
  };
};
