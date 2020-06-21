'use strict';
const authorizer = require('../../../../src/utils/authorizer');
const expect = require('chai').expect;

const USER_1 = {
    userId: "Test ID",
    userType: 'customer'
};
const USER_2 = {
    userId: "Test ID",
    userType: 'admin'
}
const PERMITTED_USER_TYPES = ['customer', 'store'];

describe('Tests for checkIfIncludes function', () => {
    it('returns true if included', () => {
        const actual = authorizer.checkIfIncludes(USER_1, PERMITTED_USER_TYPES);
        expect(actual).to.be.true;
    });
    it('returns false if not included', () => {
        const actual = authorizer.checkIfIncludes(USER_2, PERMITTED_USER_TYPES);
        expect(actual).to.be.false;
    })
});