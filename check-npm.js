import { Meteor } from 'meteor/meteor';
import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

if (Meteor.isClient) {
  checkNpmVersions({
    'apollo-client': '^0.5.0',
  }, 'apollo');
} else {
  checkNpmVersions({
    'graphql-server-express': '^0.4.3',
    "body-parser": "^1.15.2",
    "express": "^4.14.0",
    "graphql": "^0.7.0 || ^0.8.0",
    "graphql-tools": "^0.8.0",
  }, 'apollo');
}
