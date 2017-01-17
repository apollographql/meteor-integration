import { assert } from 'meteor/practicalmeteor:chai';
import { HTTP } from 'meteor/http';
import { createApolloServer } from 'meteor/apollo';

import { makeExecutableSchema } from 'graphql-tools';

describe('server', function() {
  it('works', async function() {
    
    // create schema
    const typeDefs = [`type Query { test(who: String): String }`];
    const resolvers = { Query: { test: (root, { who }) => `Hello ${who}`, } };
    const schema = makeExecutableSchema({ typeDefs, resolvers, });
    
    // instantiate the apollo server
    const apolloServer = createApolloServer({ schema, });
    
    // send a query to the server
    const { data: queryResult } = await HTTP.post(Meteor.absoluteUrl('/graphql'), {
      data: { query: '{ test(who: "World") }' }
    });
    
    expect(queryResult).to.deep.equal({
      data: {
        test: 'Hello World'
      }
    });
    
  });

});
  
