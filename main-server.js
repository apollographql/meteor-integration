import './check-npm.js';

import { apolloServer } from 'apollo-server';
import express from 'express';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { _ } from 'meteor/underscore';

const defaultConfig = {
  path: '/graphql',
  maxAccountsCacheSizeInMB: 1
};

export const createApolloServer = (givenOptions, givenConfig) => {
  const config = _.extend(defaultConfig, givenConfig);

  const graphQLServer = express();

  graphQLServer.use(config.path, apolloServer(async (req) => {
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
          options.context.user = user;
        }
      }
    } else {
      if (options.context) {
        delete options.context.user;
      }

    }

    return options;
  }));

  // This redirects all requests to /graphql to our Express GraphQL server
  WebApp.connectHandlers.use(Meteor.bindEnvironment(graphQLServer));
};
