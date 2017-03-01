import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import bodyParser from 'body-parser';
import express from 'express';

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';

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

  // GraphQL endpoint, enhanced with JSON body parser
  graphQLServer.use(
    config.path,
    bodyParser.json(),
    graphqlExpress(async req => {
      try {
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

        // get the login token from the headers request, given by the Meteor's
        // network interface middleware if enabled
        const loginToken = req.headers['meteor-login-token'];

        // there is a possible current user connected!
        if (loginToken) {
          // throw an error if the token is not a string
          check(loginToken, String);

          // the hashed token is the key to find the possible current user in the db
          const hashedToken = Accounts._hashLoginToken(loginToken);

          // get the possible current user from the database
          const currentUser = await Meteor.users.findOne({
            'services.resume.loginTokens.hashedToken': hashedToken,
          });

          // the current user exists, add their information to the resolvers context
          if (currentUser) {
            // find the right login token corresponding, the current user may have
            // several sessions logged on different browsers / computers
            const tokenInformation = currentUser.services.resume.loginTokens.find(
              tokenInfo => tokenInfo.hashedToken === hashedToken
            );

            // get an exploitable token expiration date
            const expiresAt = Accounts._tokenExpiration(tokenInformation.when);

            // true if the token is expired
            const isExpired = expiresAt < new Date();

            // if the token is still valid, give access to the current user
            // information in the resolvers context
            if (!isExpired) {
              options.context = {
                ...options.context,
                user: currentUser,
                userId: currentUser._id,
              };
            }
          }
        }

        // return the configured options to be used by the graphql server
        return options;
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

  // This binds the specified paths to the Express server running Apollo + GraphiQL
  WebApp.connectHandlers.use(Meteor.bindEnvironment(graphQLServer));
};
