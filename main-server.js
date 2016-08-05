import './check-npm.js';

import { apolloExpress, graphiqlExpress } from 'apollo-server';
import bodyParser from 'body-parser';
import express from 'express';

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { _ } from 'meteor/underscore';

// Some default settings for Apollo and GraphiQL
const defaultApolloConfig = {
  path: '/graphql',
  maxAccountsCacheSizeInMB: 1
};

const defaultGraphiQLConfig = {
  path: '/graphiql',
  endpointURL : '/graphql'
};

// startApolloServer starts the GraphQL endpoint and conditionanly starts the GraphiQL endpoint
export const startApolloServer = (givenOptions, givenApolloConfig, givenGraphiQLConfig) => {

  const ApolloConfig = _.extend(defaultApolloConfig, givenApolloConfig);

  const graphQLServer = express();

  // GraphQL endpoint
  graphQLServer.use(ApolloConfig.path, bodyParser.json(), apolloExpress(async (req) => {
    let options,
        user = null;

    if (_.isFunction(givenOptions))
      options = givenOptions(req);
    else
      options = givenOptions;

    options = options || {};

    // Get the token from the header
    if (req.headers.authorization) {
      const token = req.headers.authorization;
      check(token, String);
      const hashedToken = Accounts._hashLoginToken(token);

      // Get the user from the database
      user = await Meteor.users.findOne(
        {"services.resume.loginTokens.hashedToken": hashedToken},
        {fields: {
          _id: 1,
          'services.resume.loginTokens.$': 1
        }});

      if (user) {
        const expiresAt = Accounts._tokenExpiration(user.services.resume.loginTokens[0].when);
        const isExpired = expiresAt < new Date();

        if (!isExpired) {
          if (!options.context) {
            options.context = {};
          }

          options.context.userId = user._id;
        }
      }
    }

    return options;
    
  }));

  // If GraphiQL argument, the 3rd argument to startApolloServer(), is not false, start GraphiQL.
  if (givenGraphiQLConfig) {
    const graphiqlConfig = _.extend(defaultGraphiQLConfig, givenGraphiQLConfig);

    graphQLServer.use(graphiqlConfig.path, graphiqlExpress(graphiqlConfig));
  }

  // This binds the specified paths to the Express server running Apollo + GraphiQL
  WebApp.connectHandlers.use(Meteor.bindEnvironment(graphQLServer));
};
