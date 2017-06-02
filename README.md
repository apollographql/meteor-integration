[![Build Status](https://travis-ci.org/apollographql/meteor-integration.svg?branch=master)](https://travis-ci.org/apollographql/meteor-integration)

Use the [Apollo GraphQL](http://dev.apollodata.com/) client and server in your [Meteor](https://www.meteor.com/) app.

```sh
meteor add apollo
meteor npm install --save apollo-client graphql-server-express express graphql graphql-tools body-parser
```

Read **[the docs](http://dev.apollodata.com/core/meteor.html)**

Check out the **[code tour](https://www.codetours.xyz/tour/xavcz/meteor-apollo-codetour)** if you'd like to see how this small package is implemented.


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

```bash
git clone https://github.com/apollostack/meteor-integration.git
cd meteor-integration
npm install
npm run test
open http://localhost:3000
```

Ignore the npm peer requirements warning that appears on client and server consoles.

## Credits

[Contributors](https://github.com/apollostack/meteor-integration/graphs/contributors)
