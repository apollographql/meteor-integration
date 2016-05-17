import { assert } from 'meteor/practicalmeteor:chai';

import { createMeteorNetworkInterface } from 'meteor/apollo';

describe('client', function() {

  it('works', function() {
    assert.ok(createMeteorNetworkInterface());
  });

});
  
