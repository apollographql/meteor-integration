import { Meteor } from 'meteor/meteor';
import { assert } from 'meteor/practicalmeteor:chai';
import { HTTP } from 'meteor/http';
import { Random } from 'meteor/random';
import {
  createApolloServer,
  createMeteorNetworkInterface,
  meteorClientConfig,
} from 'meteor/apollo';
import { Accounts } from 'meteor/accounts-base';

import { makeExecutableSchema } from 'graphql-tools';
import { ApolloClient } from 'apollo-client';
import gql from 'graphql-tag';
import 'isomorphic-fetch';

// note: we are using several times `createApolloServer` in this file. It feels
// like the `/graphql` endpoint gets overwritten each time. Is there a way to
// "stop" it (a method on WebApp?) before creating a new one?

// Insert/update a test user with a fresh login token
Meteor.users.upsert(
  { username: 'test' },
  {
    username: 'test',
    services: {
      resume: {
        loginTokens: [
          {
            when: new Date(),
            hashedToken: Accounts._hashLoginToken('foobar123'),
          },
        ],
      },
    },
  }
);

// Create schema & resolvers used in the tests
const typeDefs = [
  `
  type Query {
    test(who: String): String
    author: Author
    person: Person
    randomString: String
    currentUser: User
    testContextFn: String
  }

  type Author {
    firstName: String
    lastName: String
  }

  type Person {
    name: String
  }

  type User {
    _id: String
    username: String
  }
`,
];

const resolvers = {
  Query: {
    test: (root, { who }) => `Hello ${who}`,
    author: __ => ({ firstName: 'John', lastName: 'Smith' }),
    person: __ => ({ name: 'John Smith' }),
    randomString: __ => Random.id(),
    currentUser: (root, args, context) => context.user,
    testContextFn: (root, args, context) => context.dataFromUserContext,
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

// utility function for async operations
const handleDone = fn => async done => {
  try {
    await fn();
    done();
  } catch (e) {
    done(e);
  }
};

describe('GraphQL Server', () => {
  it(
    'should create an express graphql server accepting a test query',
    handleDone(async () => {
      // instantiate the apollo server
      const apolloServer = createApolloServer({ schema });

      // send a query to the server
      const { data: queryResult } = await HTTP.post(Meteor.absoluteUrl('/graphql'), {
        data: { query: '{ test(who: "World") }' },
      });

      assert.deepEqual(queryResult, {
        data: {
          test: 'Hello World',
        },
      });
    })
  );

  it(
    'should work when passing options as a function',
    handleDone(async () => {
      // instantiate the apollo server with options as a function
      const apolloServer = createApolloServer(req => ({ schema }));

      // send a query to the server
      const { data: queryResult } = await HTTP.post(Meteor.absoluteUrl('/graphql'), {
        data: { query: '{ test(who: "World") }' },
      });

      assert.deepEqual(queryResult, {
        data: {
          test: 'Hello World',
        },
      });
    })
  );
});

describe('User Accounts', () => {
  it('should use Meteor Accounts middleware when a login token is set server-side', () => {
    const networkInterface = createMeteorNetworkInterface({
      useMeteorAccounts: true,
      loginToken: 'xyz',
    });

    assert.lengthOf(networkInterface._middlewares, 1);
  });

  it(
    'should return the current user when passing the right login token to the network interface server-side',
    handleDone(async () => {
      // instantiate the apollo server
      const apolloServer = createApolloServer({ schema });

      const networkInterface = createMeteorNetworkInterface({
        useMeteorAccounts: true,
        loginToken: 'foobar123',
      });

      const client = new ApolloClient(meteorClientConfig({ networkInterface }));

      // send a query to the server
      const { data: { currentUser } } = await client.query({
        query: gql`{ currentUser { username } }`,
      });

      assert.propertyVal(currentUser, 'username', 'test');
    })
  );

  it(
    'should not return the current user when passing an invalid login token to the network interface server-side',
    handleDone(async () => {
      // instantiate the apollo server
      const apolloServer = createApolloServer({ schema });

      const networkInterface = createMeteorNetworkInterface({
        useMeteorAccounts: true,
        loginToken: 'xyz',
      });

      const client = new ApolloClient(meteorClientConfig({ networkInterface }));

      // send a query to the server
      const { data: { currentUser } } = await client.query({
        query: gql`{ currentUser { username } }`,
      });

      assert.isNull(currentUser);
    })
  );

  it(
    'should include user and added data in the context when passing options.context as a synchronous function',
    handleDone(async () => {
      // instantiate the apollo server with options.context as a function which adds an additional field including data
      // from the user context
      const apolloServer = createApolloServer(
        {
          schema,
          context: context => {
            const { user: { username } = {} } = context || {};
            return {
              ...context,
              dataFromUserContext: username,
            };
          },
        },
        // NOTE: Had to use a unique path for this test, when run along with other tests on the same endpoint it was not
        // working properly, but when running alone, it works. The options.context was being overwritten by other tests.
        { path: '/contextFn' }
      );

      const networkInterface = createMeteorNetworkInterface({
        useMeteorAccounts: true,
        loginToken: 'foobar123',
        uri: Meteor.absoluteUrl('contextFn'),
      });

      const client = new ApolloClient(meteorClientConfig({ networkInterface }));

      // send a query to the server
      const { data: { testContextFn } } = await client.query({
        query: gql`{ testContextFn }`,
      });

      assert.equal(testContextFn, 'test');
    })
  );

  it(
    'should include user and added data in the context when passing options.context as an asynchronous function',
    handleDone(async () => {
      // instantiate the apollo server with options.context as a function which adds an additional field including data
      // from the user context
      const apolloServer = createApolloServer(
        {
          schema,
          context: async context => {
            const { user: { username } = {} } = context || {};
            return {
              ...context,
              dataFromUserContext: await Promise.resolve(username),
            };
          },
        },
        // NOTE: Had to use a unique path for this test, when run along with other tests on the same endpoint it was not
        // working properly, but when running alone, it works. The options.context was being overwritten by other tests.
        { path: '/contextFn' }
      );

      const networkInterface = createMeteorNetworkInterface({
        useMeteorAccounts: true,
        loginToken: 'foobar123',
        uri: Meteor.absoluteUrl('contextFn'),
      });

      const client = new ApolloClient(meteorClientConfig({ networkInterface }));

      // send a query to the server
      const { data: { testContextFn } } = await client.query({
        query: gql`{ testContextFn }`,
      });

      assert.equal(testContextFn, 'test');
    })
  );
});
