import '/check-npm.js';

import { createNetworkInterface } from 'apollo-client';
import { addTypenameToSelectionSet } from 'apollo-client/queries/queryTransform';
import { Accounts } from 'meteor/accounts-base';
import { _ } from 'meteor/underscore';

const defaultNetworkInterfaceConfig = {
  url: '/graphql',
  options: {},
  useMeteorAccounts: true
};

export const createMeteorNetworkInterface = (givenConfig) => {
  const config = _.extend(defaultNetworkInterfaceConfig, givenConfig);

  const networkInterface = createNetworkInterface(config.url);

  if (config.useMeteorAccounts) {
    networkInterface.use([{
      applyMiddleware(request, next) {
        const currentUserToken = Accounts._storedLoginToken();

        if (!currentUserToken) {
          next();
          return;
        }

        if (!request.options.headers) {
          request.options.headers = new Headers();
        }

        request.options.headers.MeteorLoginToken = currentUserToken;

        next();
      },
    }]);
  }

  return networkInterface;
};

const defaultConfig = {
  networkInterface: createMeteorNetworkInterface(),
  queryTransformer: addTypenameToSelectionSet,
  // Default to using Mongo _id, must use _id for queries.
  dataIdFromObject: (result) => {
    if (result._id && result.__typename) {
      return result.__typename + result._id;
    }
  },
};

export const meteorClientConfig = (givenConfig) => (_.extend(defaultConfig, givenConfig));
