Use the [Apollo Stack](http://dev.apollodata.com/) in your [Meteor](https://www.meteor.com/) app.

```sh
meteor add apollo
```

# Docs

**[The docs](http://dev.apollodata.com/core/meteor.html)**

# Apollo Optics

See below for a minimal example with Apollo Optics integration

```js
import { createApolloServer } from 'meteor/apollo';
import OpticsAgent from 'optics-agent';

import executableSchema from 'schema.js';

OpticsAgent.instrumentSchema(executableSchema);

createApolloServer(req => ({
  schema: executableSchema,
  context: {
    opticsContext: OpticsAgent.context(req),
  },
}), {
  configServer: (graphQLServer) => {
    graphQLServer.use('/graphql', OpticsAgent.middleware());
  },
});
```

# Package dev

## Tests

TODO broken, see #3

```bash
git clone git@github.com:apollostack/meteor-integration.git
cd meteor-integration
meteor test-packages ./ --driver-package practicalmeteor:mocha
open localhost:3000
```

## Credits

[Contributors](https://github.com/apollostack/meteor-integration/graphs/contributors)
