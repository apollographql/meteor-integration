import { assert } from 'meteor/practicalmeteor:chai';
import { createMeteorNetworkInterface } from 'meteor/apollo';

import ApolloClient from 'apollo-client';
import gql from 'graphql-tag';
import { print } from 'graphql-tag/printer';
import 'isomorphic-fetch';

// Some helper queries + results
const authorQuery = gql`
  query {
    author {
      firstName
      lastName
    }
  }`;

const authorResult = {
  data: {
    author: {
      firstName: 'John',
      lastName: 'Smith',
    },
  },
};

const personQuery = gql`
  query {
    person {
      name
    }
  }`;
  
const personResult = {
  data: {
    person: {
      name: 'John Smith',
    },
  },
};

// Authenticate the test user
Meteor._localStorage.setItem('Meteor.loginToken', 'foobar123');

describe('Network interface', function() {
  
  it('should create a network interface', function() {
    assert.ok(createMeteorNetworkInterface({batchingInterface: false}));
  });
  
});

describe('Batching network interface', function() {
  
  // from apollo-client/src/transport/networkInterface
  const printRequest = request => ({...request, query: print(request.query)});
  
  // from apollo-client/test
  // Helper method that tests a roundtrip given a particular set of requests to the
  // batched network interface
  const assertRoundtrip = ({
    requestResultPairs,
    opts = {},
  }) => {
    const batchedNetworkInterface = createMeteorNetworkInterface({
      batchingInterface: true,
      opts
    });
  
    const printedRequests = [];
    const resultList = [];
    requestResultPairs.forEach(({ request, result }) => {
      printedRequests.push(printRequest(request));
      resultList.push(result);
    });
  
    return batchedNetworkInterface.batchQuery(requestResultPairs.map(({ request }) => request))
      .then((results) => {
        assert.deepEqual(results, resultList);
      });
  };
  
  it('should create a batching interface & correctly return the result for a single request', () => {
    return assertRoundtrip({
      requestResultPairs: [{
        request: { query: authorQuery },
        result: authorResult,
      }],
    });
  });
  
  it('should should create a batching interface & correctly return the results for multiple requests', () => {
    return assertRoundtrip({
      requestResultPairs: [
        {
          request: { query: authorQuery },
          result: authorResult,
        },
        {
          request: { query: personQuery },
          result: personResult,
        },
      ],
    });
  });

});

describe('User Accounts', function() {
  
  // create a test util to compare a test login token to the one stored in local storage
  const TestLoginToken = () => {
    // default test login token value
    let token = null;
    
    return {
      // returns the value of the test login token
      get: () => token,
      // returns a middleware setting the test login token
      middleware: {
        applyMiddleware: (request, next) => {
          if (request.options.headers) {
            // grab the login token from the request and assign it to the test token
            token = request.options.headers.Authorization;
          }
          next();
        },
      },
    };
  };
  
  it('should use Meteor Accounts if the option is set', async (done) => {
    try {
      // create a network interface using Meteor Accounts middleware
      const networkInterface = createMeteorNetworkInterface({ useMeteorAccounts: true });
      
      // create a test login token and assign its test middleware to the network interface
      const testLoginToken = new TestLoginToken();
      networkInterface.use([testLoginToken.middleware]);
      
      // run a test query
      const client = new ApolloClient({ networkInterface });
      await client.query({query: authorQuery })
      
      // the login token sent with the request should be equal to the one in local storage
      assert.equal(testLoginToken.get(), Meteor._localStorage.getItem('Meteor.loginToken'));
      done();
    } catch(error) {
      done(error);
    }
  });
  
  it('should not use Meteor Accounts if the option is unset', async (done) => {
    try {
      // create a network interface NOT using Meteor Accounts middleware
      const networkInterface = createMeteorNetworkInterface({ useMeteorAccounts: false });
      
      // create a test login token and assign its test middleware to the network interface
      const testLoginToken = new TestLoginToken();
      networkInterface.use([testLoginToken.middleware]);
      
      // run a test query
      const client = new ApolloClient({ networkInterface });
      await client.query({query: authorQuery })
      
      // there shouldn't be any login token sent with the request
      assert.isNull(testLoginToken.get());      
      done();
    } catch(error) {
      done(error);
    }
  });
  
  it('should not use Meteor Accounts middleware when a login token is set directly from the client', () => {
    // a note adressed to someone who runs tests and looks at the client-side console
    console.log('Note: the error shown in the console below comes from the test "should not use Meteor Accounts middleware when a login token is set directly from the client".');
    
    // create an "invalid" network interface
    const networkInterface = createMeteorNetworkInterface({
      useMeteorAccounts: true,
      loginToken: 'xyz',
    });
    
    // there shouldn't be any middleware (i.e. not the Meteor Accounts middleware) attached
    assert.lengthOf(networkInterface._middlewares, 0);
  });
  
});
  
