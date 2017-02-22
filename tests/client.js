import { assert } from 'meteor/practicalmeteor:chai';
import { createMeteorNetworkInterface, meteorClientConfig } from 'meteor/apollo';

import ApolloClient from 'apollo-client';
import gql from 'graphql-tag';
import { print } from 'graphql-tag/printer';
import 'whatwg-fetch';

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

describe('Query deduplication', () => {
  
  const randomQuery = gql`
    query {
      randomString
    }`;
  
  it('does not deduplicate queries by default', () => {
    
    // we have two responses for identical queries, but only the first should be requested.
    // the second one should never make it through to the network interface.
    const client = new ApolloClient(meteorClientConfig());

    const q1 = client.query({ query: randomQuery });
    const q2 = client.query({ query: randomQuery });

    // if deduplication happened, result2.data will equal data.
    return Promise.all([q1, q2]).then(([result1, result2]) => {
      assert.notDeepEqual(result1.data, result2.data);
    });
  });

  it('deduplicates queries if the option is set', () => {

    // we have two responses for identical queries, but only the first should be requested.
    // the second one should never make it through to the network interface.
    
    const client = new ApolloClient(meteorClientConfig({queryDeduplication: true}));

    const q1 = client.query({ query: randomQuery });
    const q2 = client.query({ query: randomQuery });

    // if deduplication didn't happen, result.data will equal data2.
    return Promise.all([q1, q2]).then(([result1, result2]) => {
      assert.deepEqual(result1.data, result2.data);
    });
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
  
