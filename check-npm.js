import { Meteor } from 'meteor/meteor';
import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

if (Meteor.isClient) {
  checkNpmVersions({
    'apollo-client': '^0.4.11',
  }, 'apollo');
} else {
  checkNpmVersions({
    'apollo-server': '^0.2.1',
    'express': '^4.13.4',
  }, 'apollo');
}
