WIP doesn't work

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Usage](#usage)
  - [Client](#client)
  - [Server](#server)
- [API](#api)
  - [createMeteorNetworkInterface](#createmeteornetworkinterface)
  - [createApolloServer](#createapolloserver)
- [Development](#development)
  - [Run tests](#run-tests)
  - [Credits](#credits)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Usage

```
meteor add apollo
meteor npm add --save apollo-client apollo-server express http-proxy-middleware
```

## Client

Connect to the Apollo server with [`createMeteorNetworkInterface`](#createmeteornetworkinterface):

```js
import ApolloClient from 'apollo-client';
import { createMeteorNetworkInterface } from 'meteor/apollo';

const client = new ApolloClient({
  networkInterface: createMeteorNetworkInterface()
});
```

## Server

Create the Apollo server with [`createApolloServer`](#createapolloserver):

```js
import { createApolloServer } from 'meteor/apollo';

import schema from '/imports/api/schema';
import resolvers from '/imports/api/resolvers';

createApolloServer({
  graphiql: true,
  pretty: true,
  schema,
  resolvers,
});
```

Inside your resolvers, if the user is logged in, their id will be  `context.userId`:

```js
user(root, args, context) {
  // Only return data if the fetched id matches the current user, for security
  if (context.userId === args.id) {
    return Meteor.users.findOne(args.id);
  }
}
```

# API

## createMeteorNetworkInterface

`createMeteorNetworkInterface(config)`

`config` may contain any of the following fields:
- `url`: URL of the GraphQL server. Default: `'/graphql'`.
- `options`: `FetchOptions` passed to [`createNetworkInterface`](http://docs.apollostack.com/apollo-client/index.html#createNetworkInterface). Default: `{}`.
- `useMeteorAccounts`: Whether to send the current user's login token to the GraphQL server with each request. Default: `true`.

## createApolloServer

`createApolloServer(options, config)`

- [`options`](http://docs.apollostack.com/apollo-server/tools.html#apolloServer)
- `config` may contain any of the following fields:
  - `path`: [Path](http://expressjs.com/en/api.html#app.use) of the GraphQL server. Default: `'/graphql'`.
  - `port`: Port for the express server to listen on. Default: `4000`.
  - `maxAccountsCacheSizeInMB`: User account ids are cached in memory to reduce the response latency on multiple requests from the same user. Default: `1`.

# Development

## Tests

```bash
git clone git@github.com:apollostack/meteor-integration.git
cd meteor-integration
meteor test-packages ./ --driver-package practicalmeteor:mocha
open localhost:3000
```

## Credits

[Contributors](https://github.com/apollostack/meteor-integration/graphs/contributors)
