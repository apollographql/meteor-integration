import { assert } from 'meteor/practicalmeteor:chai';
import { HTTP } from 'meteor/http';
import { createApolloServer } from 'meteor/apollo';

import { makeExecutableSchema } from 'graphql-tools';

describe('Graphql Server', function() {
  
  // create schema
  const typeDefs = [`
    type Query {
      test(who: String): String
      author: Author
      person: Person
    }
    
    type Author {
      firstName: String
      lastName: String
    }
    
    type Person {
      name: String
    }
  `];
  
  const resolvers = {
    Query: {
      test: (root, { who }) => `Hello ${who}`, 
      author: __ => ({firstName: 'John', lastName: 'Smith'}),
      person: __ => ({name: 'John Smith'}),
    } 
  };
  
  const schema = makeExecutableSchema({ typeDefs, resolvers, });
  
  it('should create an express graphql server accepting a test query', async function() {
    
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
  
