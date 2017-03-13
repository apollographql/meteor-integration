import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import bodyParser from 'body-parser';
import express from 'express';
import { SubscriptionManager } from 'graphql-subscriptions';
import { SubscriptionServer } from 'subscriptions-transport-ws';

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import { addCurrentUserToContext } from './accounts';
import './check-npm.js';

// import the configuration functions from the client so they can be used
// during server-side rendering for instance
export { createMeteorNetworkInterface, meteorClientConfig } from './main-client';

// default server configuration object
const defaultServerConfig = {
  // graphql endpoint
  path: '/graphql',
  // additional Express server configuration (enable CORS there for instance)
  configServer: graphQLServer => {},
  // enable GraphiQL only in development mode
  graphiql: Meteor.isDevelopment,
  // GraphiQL endpoint
  graphiqlPath: '/graphiql',
  // GraphiQL options (default: log the current user in your request)
  graphiqlOptions: {
    passHeader: "'meteor-login-token': localStorage['Meteor.loginToken']",
  },
  subscriptionSetupFunctions: {},
  subscriptionLifecycle: {},
};

// default graphql options to enhance the graphQLExpress server
const defaultGraphQLOptions = {
  // ensure that a context object is defined for the resolvers
  context: {},
  // error formatting
  formatError: e => ({
    message: e.message,
    locations: e.locations,
    path: e.path,
  }),
  // additional debug logging if execution errors occur in dev mode
  debug: Meteor.isDevelopment,
};

export const createApolloServer = (customOptions = {}, customConfig = {}) => {
  // create a new server config object based on the default server config
  // defined above and the custom server config passed to this function
  const config = {
    ...defaultServerConfig,
    ...customConfig,
  };

  if (customConfig.graphiqlOptions) {
    config.graphiqlOptions = {
      ...defaultServerConfig.graphiqlOptions,
      ...customConfig.graphiqlOptions,
    };
  }

  // the Meteor GraphQL server is an Express server
  const graphQLServer = express();

  // enhance the GraphQL server with possible express middlewares
  config.configServer(graphQLServer);

  // graphqlExpress can accept a function returning the option object
  const customOptionsObject = typeof customOptions === 'function'
    ? customOptions(req)
    : customOptions;

  // create a new apollo options object based on the default apollo options
  // defined above and the custom apollo options passed to this function
  const options = {
    ...defaultGraphQLOptions,
    ...customOptionsObject,
  };

  // GraphQL endpoint, enhanced with JSON body parser
  graphQLServer.use(
    config.path,
    bodyParser.json(),
    graphqlExpress(async req => {
      try {
        // get the login token from the headers request, given by the Meteor's
        // network interface middleware if enabled
        const loginToken = req.headers['meteor-login-token'];

        // plug the current user & the user id to the context
        const newContext = await addCurrentUserToContext(options.context, loginToken);

        // return the configured options to be used by the graphql server
        return {
          ...options,
          context: newContext,
        };
      } catch (error) {
        // something went bad when configuring the graphql server, we do not
        // swallow the error and display it in the server-side logs
        console.error(
          '[Meteor Apollo Integration] Something bad happened when handling a request on the GraphQL server. Your GraphQL server is not working as expected:',
          error
        );

        // return the default graphql options anyway
        return defaultGraphQLOptions;
      }
    })
  );

  // Start GraphiQL if enabled
  if (config.graphiql) {
    // GraphiQL endpoint
    graphQLServer.use(
      config.graphiqlPath,
      graphiqlExpress({
        // GraphiQL options
        ...config.graphiqlOptions,
        // endpoint of the graphql server where to send requests
        endpointURL: config.path,
      })
    );
  }

  // this binds the specified paths to the Express server running Apollo + GraphiQL
  WebApp.connectHandlers.use(graphQLServer);

  // a data publication mechanism is set up, add subscription manager & server!
  if (options.pubsub) {
    // create the subscription manager thanks to the schema & pubsub options
    const subscriptionManager = new SubscriptionManager({
      schema: options.schema,
      pubsub: options.pubsub,
      // eventual publication filtering
      setupFunctions: config.subscriptionSetupFunctions,
    });

    // start up a subscription server
    new SubscriptionServer(
      {
        subscriptionManager,
        // on connect subscription lifecycle event
        onConnect: async (connectionParams, webSocket) => {
          // if a meteor login token is passed to the connection params from
          // the client, add the current user to the subscription context
          const subscriptionContext = connectionParams.meteorLoginToken
            ? await addCurrentUserToContext(options.context, connectionParams.meteorLoginToken)
            : options.context;

          return subscriptionContext;
        },
      },
      {
        // bind the subscription server to Meteor WebApp
        server: WebApp.httpServer,
        path: '/subscriptions',
      }
    );
  }
};
