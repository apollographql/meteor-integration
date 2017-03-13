import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';

// grab the token from the storage or config to be used in the network interface creation
export const getMeteorLoginToken = (config = {}) => {
  // possible cookie login token created by meteorhacks:fast-render
  // and passed to the Apollo Client during server-side rendering
  const { loginToken = null } = config;

  if (Meteor.isClient && loginToken) {
    throw Error(
      '[Meteor Apollo Integration] The current user is not handled with your GraphQL operations: you are trying to pass a login token to an Apollo Client instance defined client-side. This is only allowed during server-side rendering, please check your implementation.'
    );
  }

  // Meteor accounts-base login token stored in local storage,
  // only exists client-side as of Meteor 1.4, will exist with Meteor 1.5
  const localStorageLoginToken = Meteor.isClient && Accounts._storedLoginToken();

  // return a meteor login token if existing
  // ex: grabbed from local storage or passed during server-side rendering
  return localStorageLoginToken || loginToken;
};

// take the existing context and return a new extended context with the current
// user if relevant (i.e. valid login token)
export const addCurrentUserToContext = async (context, loginToken) => {
  // there is a possible current user connected!
  if (loginToken) {
    // throw an error if the token is not a string
    check(loginToken, String);

    // the hashed token is the key to find the possible current user in the db
    const hashedToken = Accounts._hashLoginToken(loginToken);

    // get the possible current user from the database
    // note: no need of a fiber aware findOne + a fiber aware call break tests
    // runned with practicalmeteor:mocha if eslint is enabled
    const currentUser = await Meteor.users.rawCollection().findOne({
      'services.resume.loginTokens.hashedToken': hashedToken,
    });

    // the current user exists
    if (currentUser) {
      // find the right login token corresponding, the current user may have
      // several sessions logged on different browsers / computers
      const tokenInformation = currentUser.services.resume.loginTokens.find(
        tokenInfo => tokenInfo.hashedToken === hashedToken
      );

      // get an exploitable token expiration date
      const expiresAt = Accounts._tokenExpiration(tokenInformation.when);

      // true if the token is expired
      const isExpired = expiresAt < new Date();

      // if the token is still valid, give access to the current user
      // information in the resolvers context
      if (!isExpired) {
        // return a new context object with the current user & her id
        return {
          ...context,
          user: currentUser,
          userId: currentUser._id,
        };
      }
    }
  }

  // return the context as passed
  return context;
};
