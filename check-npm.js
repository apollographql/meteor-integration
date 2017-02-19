import { Meteor } from 'meteor/meteor';
import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

if (Meteor.isClient) {
  checkNpmVersions({
    'apollo-client': '^0.8.0',
    'isomorphic-fetch': '^2.2.1',
  }, 'apollo');
} else {
  checkNpmVersions({
    'graphql-server-express': '^0.5.0',
    "body-parser": "^1.15.2",
    "express": "^4.14.0",
    "graphql": "^0.9.0",
    "graphql-tools": "^0.10.0",
  }, 'apollo');
}
