import fs from 'fs';

import { Validator } from '../../src/validators/Validator';

jest.mock('fs');

class TestValidator extends Validator {
    async validate() {
        return {};
    }
}

describe('Validator', () => {
    let validator: Validator;

    beforeEach(() => {
        validator = new TestValidator();
    });

    describe('directoryExists', () => {
        it('should return true if directory exists', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            expect(validator.directoryExists('/path/to/dir')).toBe(true);
        });

        it('should return false if directory does not exist', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            expect(validator.directoryExists('/path/to/nowhere')).toBe(false);
        });
    });

    describe('isNumber', () => {
        it('should return true for valid numbers', () => {
            expect(validator.isNumber(123)).toBe(true);
            expect(validator.isNumber('456')).toBe(true);
        });

        it('should return false for invalid numbers', () => {
            expect(validator.isNumber('')).toBe(false);
            expect(validator.isNumber('abc')).toBe(false);
        });
    });

    describe('matchesRegex', () => {
        it('should return true if string matches regex', () => {
            expect(validator.matchesRegex('hello123', /^[a-z]+\d+$/)).toBe(true);
        });

        it('should return false if string does not match regex', () => {
            expect(validator.matchesRegex('hello', /^\d+$/)).toBe(false);
        });
    });
});
