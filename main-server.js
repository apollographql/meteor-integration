import './check-npm.js';

import { apolloServer } from 'apollo-server';
import express from 'express';
import proxyMiddleware from 'http-proxy-middleware';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { _ } from 'meteor/underscore';

import { schema, resolvers } from '/imports/api/schema';

const defaultConfig = {
  path: '/graphql',
  maxAccountsCacheSizeInMB: 1
};

export const createApolloServer = (givenOptions, givenConfig) => {
  const config = _.extend(defaultConfig, givenConfig);

  const graphQLServer = express();

  graphQLServer.use(config.url, apolloServer(async (req) => {
    let options,
        user = null;

    if (_.isFunction(givenOptions))
      options = givenOptions(req);
    else
      options = givenOptions;

    options = options || {};

    // Get the token from the header
    if (req.headers.meteorlogintoken) {
      const token = req.headers.meteorlogintoken;
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
        const expiresAt = user.services.resume.loginTokens[0].when;
        const isExpired = expiresAt < Date.now(); // TODO or new Date()

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
  
  // This redirects all requests to /graphql to our Express GraphQL server
  WebApp.rawConnectHandlers.use(Meteor.bindEnvironment(graphQLServer));
}
