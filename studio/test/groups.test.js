import { expect } from '@esm-bundle/chai';
import Store from '../src/store.js';
import { canAccessSettings, canEditPromotions, isMasAdmin } from '../src/groups.js';

describe('groups', () => {
    let originalProfile;
    let originalUsers;

    beforeEach(() => {
        originalProfile = structuredClone(Store.profile.get());
        originalUsers = structuredClone(Store.users.get());
    });

    afterEach(() => {
        Store.profile.set(originalProfile);
        Store.users.set(originalUsers);
    });

    it('isMasAdmin is true only for GRP-ODIN-MAS-ADMINS', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ADMINS'] }]);
        expect(isMasAdmin()).to.be.true;

        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-POWERUSERS'] }]);
        expect(isMasAdmin()).to.be.false;
    });

    it('canAccessSettings allows admin on any mapped or admin-only surface', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ADMINS'] }]);
        expect(canAccessSettings('acom')).to.be.true;
        expect(canAccessSettings('sandbox')).to.be.true;
    });

    it('canAccessSettings requires matching POWERUSERS group per surface', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-POWERUSERS'] }]);
        expect(canAccessSettings('acom')).to.be.true;
        expect(canAccessSettings('ccd')).to.be.false;
    });

    it('canAccessSettings denies sandbox for non-admin', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-POWERUSERS'] }]);
        expect(canAccessSettings('sandbox')).to.be.false;
    });

    it('canAccessSettings normalizes path segment', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-POWERUSERS'] }]);
        expect(canAccessSettings('/acom/extra')).to.be.true;
    });

    it('canAccessSettings matches user email case-insensitively', () => {
        Store.users.set([{ userPrincipalName: 'power.user@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-CC-POWERUSERS'] }]);
        Store.profile.set({ email: 'Power.User@adobe.com' });
        expect(canAccessSettings('acom-cc')).to.be.true;

        Store.users.set([{ userPrincipalName: 'Power.User@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-CC-POWERUSERS'] }]);
        Store.profile.set({ email: 'power.user@adobe.com' });
        expect(canAccessSettings('acom-cc')).to.be.true;
    });

    it('canAccessSettings is false without surface path', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-POWERUSERS'] }]);
        expect(canAccessSettings('')).to.be.false;
        expect(canAccessSettings(undefined)).to.be.false;
    });

    it('canEditPromotions is true for admins and promo editors, false otherwise', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ADMINS'] }]);
        expect(canEditPromotions()).to.be.true;

        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] }]);
        expect(canEditPromotions()).to.be.true;

        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-POWERUSERS'] }]);
        expect(canEditPromotions()).to.be.false;
    });

    it('canEditPromotions matches user email case-insensitively', () => {
        Store.users.set([{ userPrincipalName: 'promo.editor@adobe.com', groups: ['grp-odin-mas-promo-editors'] }]);
        Store.profile.set({ email: 'Promo.Editor@adobe.com' });
        expect(canEditPromotions()).to.be.true;
    });

    it('canEditPromotions is false when the user is not found', () => {
        Store.profile.set({ email: 'unknown@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] }]);
        expect(canEditPromotions()).to.be.false;
    });
});
