import '/check-npm.js';

import { createNetworkInterface } from 'apollo-client';
import { Accounts } from 'meteor/accounts-base';
import { _ } from 'meteor/underscore';

const defaultConfig = {
  url: '/graphql',
  options: {},
  useMeteorAccounts: true
};

export const createMeteorNetworkInterface = (givenConfig) => {
  const config = _.extend(defaultConfig, givenConfig);

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
      }
    }]);
  }

  return networkInterface;
}
