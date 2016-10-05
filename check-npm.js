import { Meteor } from 'meteor/meteor';
import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

if (Meteor.isClient) {
  checkNpmVersions({
    'apollo-client': '^0.4.0 || ^0.3.0',
  }, 'apollo');
} else {
  checkNpmVersions({
    'apollo-server': '^0.3.0',
    "body-parser": "^1.15.2",
    "express": "^4.14.0",
    "graphql": "^0.7.0",
    "graphql-tools": "^0.6.2",
  }, 'apollo');
}
