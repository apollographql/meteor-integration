import { assert } from 'meteor/practicalmeteor:chai';

import { createApolloServer } from 'meteor/apollo';

describe('server', function() {

  it('works', function() {
    assert.ok(createApolloServer());
  });

});
  
