This atmosphere package allows you to use the [Apollo Stack](http://docs.apollostack.com/) in your [Meteor](https://www.meteor.com/) app.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Usage](#usage)
  - [Client](#client)
  - [Server](#server)
- [API](#api)
  - [meteorClientConfig](#meteorclientconfig)
  - [createApolloServer](#createapolloserver)
- [Development](#development)
  - [Tests](#tests)
  - [Credits](#credits)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Usage

See also this simple usage example: https://github.com/lorensr/meteor-starter-kit/tree/apollo-package

```
meteor add apollo
meteor npm install --save apollo-client apollo-server express graphql graphql-tools
```

## Client

Connect to the Apollo server with [`meteorClientConfig`](#meteorclientconfig):

```js
import ApolloClient from 'apollo-client';
import { meteorClientConfig } from 'meteor/apollo';

const client = new ApolloClient(meteorClientConfig());
```

## Server

Define your schema and resolvers, and then set up the Apollo server with [`createApolloServer`](#createapolloserver):

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

The [GraphiQL](https://github.com/graphql/graphiql) url is [http://localhost:3000/graphql](http://localhost:3000/graphql)

Inside your resolvers, if the user is logged in, their id will be  `context.userId`:

```js
export const resolvers = {
  Query: {
    async user(root, args, context) {
      // Only return the current user, for security
      if (context.userId === args.id) {
        return await Meteor.users.findOne(context.userId);
      }
    },
  },
  User: ...
}
```

# API

## meteorClientConfig

`meteorClientConfig(networkInterfaceConfig)`

`networkInterfaceConfig` may contain any of the following fields:
- `path`: path of the GraphQL server. Default: `'/graphql'`.
- `options`: `FetchOptions` passed to [`createNetworkInterface`](http://docs.apollostack.com/apollo-client/index.html#createNetworkInterface). Default: `{}`.
- `useMeteorAccounts`: Whether to send the current user's login token to the GraphQL server with each request. Default: `true`.

Returns a config object for `ApolloClient`:

```
{
  networkInterface
  queryTransformer: addTypenameToSelectionSet
  dataIdFromObject: object.__typename + object._id
}
```

## createApolloServer

`createApolloServer(options, config)`

- [`options`](http://docs.apollostack.com/apollo-server/tools.html#apolloServer)
- `config` may contain any of the following fields:
  - `path`: [Path](http://expressjs.com/en/api.html#app.use) of the GraphQL server. Default: `'/graphql'`.
  - `maxAccountsCacheSizeInMB`: User account ids are cached in memory to reduce the response latency on multiple requests from the same user. Default: `1`.

It will use the same port as your Meteor server. Don't put a route or static asset at the same path as the Apollo server (default is `/graphql`).

# Development

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
