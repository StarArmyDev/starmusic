import { expect } from 'chai';
import 'mocha';

import StarMusic from '../src';

describe('[index]', () => {
    it('exports check', () => {
        expect(StarMusic).to.be.a('function');
    });
});
