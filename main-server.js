import './check-npm.js';

import { apolloServer } from 'apollo-server';
import express from 'express';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { _ } from 'meteor/underscore';
import { makeExecutableSchema } from 'graphql-tools';
import graphql from 'graphql';

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
        }
      }
    }

    return options;
  }));
  
  // This redirects all requests to /graphql to our Express GraphQL server
  WebApp.connectHandlers.use(Meteor.bindEnvironment(graphQLServer));
  
  return {
    call: async ({ query, variables }) => {
      // If userId exists, add it to the context.
      let { userId = null } = this;
    
      // Build the schema 
      const executableSchema = makeExecutableSchema({
        typeDefs: schema,
        resolvers,
        allowUndefinedInResolve: true,
      });
    
      const { data, errors } = await graphql(executableSchema, query, null, { userId }, variables);
    
      if (errors) {
        throw new Error(errors);
      }
    
      return data;
    }
  }
};
