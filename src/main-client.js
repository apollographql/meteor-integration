import { createNetworkInterface, createBatchingNetworkInterface } from 'apollo-client';
import { SubscriptionClient, addGraphQLSubscriptions } from 'subscriptions-transport-ws';

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import './check-npm.js';

// default network interface configuration object
const defaultNetworkInterfaceConfig = {
  // default graphql server endpoint: ROOT_URL/graphql
  // ex: http://locahost:3000/graphql, or https://www.my-app.com/graphql
  uri: Meteor.absoluteUrl('graphql'),
  // additional fetch options like `credentials` or `headers`
  opts: {},
  // enable the Meteor User Accounts middleware to identify the user with
  // every request thanks to their login token
  useMeteorAccounts: true,
  // use a BatchingNetworkInterface by default instead of a NetworkInterface
  batchingInterface: true,
  // default batch interval
  batchInterval: 10,
  // enable enhanced apollo network interface with a websocket client
  enableSubscriptions: false,
  // get a ws:// url from the ROOT_URL
  // ex: ws://locahost:3000/subscriptions
  websocketUri: Meteor.absoluteUrl('subscriptions').replace(/^http/, 'ws'),
};

// create a pre-configured network interface
export const createMeteorNetworkInterface = (customNetworkInterfaceConfig = {}) => {
  // create a new config object based on the default network interface config
  // defined above and the custom network interface config passed to this function
  const config = {
    ...defaultNetworkInterfaceConfig,
    ...customNetworkInterfaceConfig,
  };

  // this will be true true if a BatchingNetworkInterface is meant to be used
  // with a correct poll interval
  const useBatchingInterface = config.batchingInterface && typeof config.batchInterval === 'number';

  // allow the use of a batching network interface
  const interfaceToUse = useBatchingInterface
    ? createBatchingNetworkInterface
    : createNetworkInterface;

  // http://dev.apollodata.com/core/apollo-client-api.html#NetworkInterfaceOptions
  const interfaceArgument = {
    uri: config.uri,
    opts: config.opts,
  };

  // http://dev.apollodata.com/core/network.html#BatchingExample
  if (useBatchingInterface) {
    interfaceArgument.batchInterval = config.batchInterval;
  }

  // configure the (batching?) network interface with the config defined above
  const networkInterface = interfaceToUse(interfaceArgument);

  // handle the creation of a Meteor User Accounts middleware
  if (config.useMeteorAccounts) {
    // get the current user token if defined
    // note: will throw an error if someone tries to specify the login token
    // manually from the client
    try {
      const meteorLoginToken = getMeteorLoginToken(config);

      // dynamic middleware function name depending on the interface used
      const applyMiddlewareFn = useBatchingInterface ? 'applyBatchMiddleware' : 'applyMiddleware';

      // add a middleware handling the current user to the network interface
      networkInterface.use([
        {
          [applyMiddlewareFn](request, next) {
            // no token, meaning no user connected, just go to next possible middleware
            if (!meteorLoginToken) {
              next();
            }

            // create the header object if needed.
            if (!request.options.headers) {
              request.options.headers = {};
            }

            // add the login token to the request headers
            request.options.headers['meteor-login-token'] = meteorLoginToken;

            // go to next middleware
            next();
          },
        },
      ]);
    } catch (error) {
      // catch the potential error sent by getMeteorLoginToken if a login token
      // is manually set client-side
      console.error(error);
    }
  }

  // return a configured network interface meant to be used by Apollo Client
  // with or without subscriptions, depending on enableSubscriptions param
  if (config.enableSubscriptions) {
    // pass the login
    const connectionParams = config.useMeteorAccounts
      ? { meteorLoginToken: getMeteorLoginToken(config) }
      : {};

    // create a websocket client
    const wsClient = new SubscriptionClient(config.websocketUri, {
      reconnect: true,
      connectionParams,
    });

    // plug the graphql subscriptions
    const networkInterfaceWithSubscriptions = addGraphQLSubscriptions(networkInterface, wsClient);

    // return an enhanced interface with subscriptions
    return networkInterfaceWithSubscriptions;
  } else {
    // return an interface without subscriptions
    return networkInterface;
  }
};

// default Apollo Client configuration object
const defaultClientConfig = {
  // setup ssr mode if the client is configured server-side (ex: for SSR)
  ssrMode: Meteor.isServer,
  // leverage store normalization
  dataIdFromObject: result => {
    // store normalization with 'typename + Meteor's Mongo _id' if possible
    if (result._id && result.__typename) {
      const dataId = result.__typename + result._id;
      return dataId;
    }
    // no store normalization
    return null;
  },
};

// create a new client config object based on the default Apollo Client config
// defined above and the client config passed to this function
export const meteorClientConfig = (customClientConfig = {}) => ({
  // default network interface preconfigured, the network interface key is set
  // there to so that `createMeteorNetworkInterface` is executed only when
  // `meteorClientConfig` is called.
  networkInterface: createMeteorNetworkInterface(),
  ...defaultClientConfig,
  ...customClientConfig,
});

// grab the token from the storage or config to be used in the network interface creation
const getMeteorLoginToken = (config = {}) => {
  // possible cookie login token created by meteorhacks:fast-render
  // and passed to the Apollo Client during server-side rendering
  const { loginToken = null } = config;

  if (Meteor.isClient && loginToken) {
    throw Error(
      '[Meteor Apollo Integration] The current user is not handled with your GraphQL operations: you are trying to pass a login token to an Apollo Client instance defined client-side. This is only allowed during server-side rendering, please check your implementation.'
    );
  }

  // Meteor accounts-base login token stored in local storage,
  // only exists client-side as of Meteor 1.4, will exist with Meteor 1.5
  const localStorageLoginToken = Meteor.isClient && Accounts._storedLoginToken();

  // return a meteor login token if existing
  // ex: grabbed from local storage or passed during server-side rendering
  return localStorageLoginToken || loginToken;
};
