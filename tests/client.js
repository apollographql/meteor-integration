import { assert } from 'meteor/practicalmeteor:chai';
import { createMeteorNetworkInterface, meteorClientConfig } from 'meteor/apollo';

import ApolloClient from 'apollo-client';
import gql from 'graphql-tag';
import { print } from 'graphql';

// Some helper queries + results
const authorQuery = gql`
  query {
    author {
      firstName
      lastName
    }
  }
`;

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
  }
`;

const personResult = {
  data: {
    person: {
      name: 'John Smith',
    },
  },
};

// Authenticate the test user
Meteor._localStorage.setItem('Meteor.loginToken', 'foobar123');

describe('Meteor Client config', () => {
  it('should accept a custom configuration object extending the default ones', () => {
    const clientConfig = meteorClientConfig({
      addTypename: false, // this is not a default option of the meteorClientConfig
    });

    assert.isFalse(clientConfig.addTypename);
  });

  it('should replace some options while keeping the other options', () => {
    const fakeCustomInterface = {
      fakeProperty: 42,
    };

    // replace the default network interface to use by a fake one
    // and replace the normalization function
    const clientConfig = meteorClientConfig({
      networkInterface: fakeCustomInterface,
      dataIdFromObject: null,
    });

    // we should still have access the ssrMode default configuration value
    assert.deepEqual(clientConfig, {
      networkInterface: {
        fakeProperty: 42,
      },
      dataIdFromObject: null,
      ssrMode: false,
    });
  });

  it('should extend the default config of the network interface', () => {
    // extend the opts ultimately passed to fetch
    const networkInterface = createMeteorNetworkInterface({
      opts: {
        credentials: 'same-origin',
      },
    });

    const clientConfig = meteorClientConfig({ networkInterface });

    // ApolloClient's 'createNetworkInterface' assign 'opts' to '_opts' in its constructor
    assert.deepEqual(clientConfig.networkInterface._opts, { credentials: 'same-origin' });
  });
});

describe('Network interface', () => {
  it('should create a network interface and not a batching interface', () => {
    const networkInterface = createMeteorNetworkInterface({ batchingInterface: false });

    // as opposed to HTTPBatchedNetworkInterface
    assert.equal(networkInterface.constructor.name, 'HTTPFetchNetworkInterface');
  });
});

describe('Batching network interface', function() {
  // from apollo-client/src/transport/networkInterface
  const printRequest = request => ({ ...request, query: print(request.query) });

  // from apollo-client/test
  // Helper method that tests a roundtrip given a particular set of requests to the
  // batched network interface
  const assertRoundtrip = ({ requestResultPairs, opts = {} }) => {
    const batchedNetworkInterface = createMeteorNetworkInterface({
      batchingInterface: true,
      opts,
    });

    const printedRequests = [];
    const resultList = [];
    requestResultPairs.forEach(({ request, result }) => {
      printedRequests.push(printRequest(request));
      resultList.push(result);
    });

    return batchedNetworkInterface
      .batchQuery(requestResultPairs.map(({ request }) => request))
      .then(results => {
        assert.deepEqual(results, resultList);
      });
  };

  it('should create a batching interface & correctly return the result for a single request', () => {
    return assertRoundtrip({
      requestResultPairs: [
        {
          request: { query: authorQuery },
          result: authorResult,
        },
      ],
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
  const TestLoginToken = (batchingInterface = true) => {
    // default test login token value
    let token = null;

    const middlewareFn = batchingInterface ? 'applyBatchMiddleware' : 'applyMiddleware';

    return {
      // returns the value of the test login token
      get: () => token,
      // returns a middleware setting the test login token
      middleware: {
        [middlewareFn]: (request, next) => {
          if (request.options.headers) {
            // grab the login token from the request and assign it to the test token
            token = request.options.headers['meteor-login-token'];
          }
          next();
        },
      },
    };
  };

  it('should use Meteor Accounts middleware if the option is set', done => {
    // create a network interface using Meteor Accounts middleware
    const networkInterface = createMeteorNetworkInterface({ useMeteorAccounts: true });

    // create a test login token and assign its test middleware to the network interface
    const testLoginToken = new TestLoginToken();
    networkInterface.use([testLoginToken.middleware]);

    // run a test query
    const client = new ApolloClient({ networkInterface });

    client
      .query({ query: authorQuery })
      .then(response => {
        // the login token sent with the request should be equal to the one in local storage
        assert.equal(testLoginToken.get(), Meteor._localStorage.getItem('Meteor.loginToken'));
        done();
      })
      .catch(error => done(error));
  });

  it('should use Meteor Accounts with a "normal middleware" if the interface is not batching', done => {
    const batchingInterface = false;

    // create a network interface using Meteor Accounts middleware
    const networkInterface = createMeteorNetworkInterface({
      batchingInterface,
      useMeteorAccounts: true,
    });

    // create a test login token and assign its test middleware to the network interface
    const testLoginToken = new TestLoginToken(batchingInterface);
    networkInterface.use([testLoginToken.middleware]);

    // run a test query
    const client = new ApolloClient({ networkInterface });
    client
      .query({ query: authorQuery })
      .then(response => {
        // the login token sent with the request should be equal to the one in local storage
        assert.equal(testLoginToken.get(), Meteor._localStorage.getItem('Meteor.loginToken'));
        done();
      })
      .catch(error => done(error));
  });

  it('should not use Meteor Accounts if the option is unset', done => {
    // create a network interface NOT using Meteor Accounts middleware
    const networkInterface = createMeteorNetworkInterface({ useMeteorAccounts: false });

    // create a test login token and assign its test middleware to the network interface
    const testLoginToken = new TestLoginToken();
    networkInterface.use([testLoginToken.middleware]);

    // run a test query
    const client = new ApolloClient({ networkInterface });
    client
      .query({ query: authorQuery })
      .then(response => {
        // there shouldn't be any login token sent with the request
        assert.isNull(testLoginToken.get());
        done();
      })
      .catch(error => done(error));
  });

  it('should not use Meteor Accounts middleware when a login token is set directly from the client', () => {
    // a note adressed to someone who runs tests and looks at the client-side console
    console.log(
      'Note: the error shown in the console below comes from the test "should not use Meteor Accounts middleware when a login token is set directly from the client".'
    );

    // create an "invalid" network interface
    const networkInterface = createMeteorNetworkInterface({
      useMeteorAccounts: true,
      loginToken: 'xyz',
    });

    // there shouldn't be any middleware (i.e. not the Meteor Accounts middleware) attached
    assert.lengthOf(networkInterface._middlewares, 0);
  });
});
