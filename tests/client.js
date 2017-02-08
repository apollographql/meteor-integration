import { assert } from 'meteor/practicalmeteor:chai';

import { createMeteorNetworkInterface } from 'meteor/apollo';
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
  
