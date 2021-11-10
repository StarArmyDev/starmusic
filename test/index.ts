import { expect } from 'chai';
import 'mocha';

import StarMusic from '..';

describe('[Main]', () => {
    it('exports check', () => {
        expect(StarMusic).to.be.a('function');
    });
});
