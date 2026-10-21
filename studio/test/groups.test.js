import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import Store from '../src/store.js';
import {
    canAccessSettings,
    canAccessMasks,
    canAccessOfferMapping,
    canAccessBulkPublish,
    canEditPromotions,
    isMasAdmin,
} from '../src/groups.js';
import '../src/swc.js';
import '../src/mas-advanced-tools.js';

describe('groups', () => {
    let originalProfile;
    let originalUsers;
    let originalImsAccess;

    beforeEach(() => {
        originalProfile = structuredClone(Store.profile.get());
        originalUsers = structuredClone(Store.users.get());
        originalImsAccess = Store.users.getMeta('imsBulkPublishAccess');
        Store.users.setMeta('imsBulkPublishAccess', null);
    });

    afterEach(() => {
        fixtureCleanup();
        Store.profile.set(originalProfile);
        Store.users.set(originalUsers);
        Store.users.setMeta('imsBulkPublishAccess', originalImsAccess);
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

    it('canAccessBulkPublish allows ACOM curators', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-CURATORS'] }]);
        expect(canAccessBulkPublish()).to.be.true;
    });

    it('canAccessBulkPublish allows an IMS-approved test identity missing from LDAP', () => {
        Store.profile.set({ email: 'Automation@AdobeTest.com' });
        Store.users.set([]);
        Store.users.setMeta('imsBulkPublishAccess', { email: 'automation@adobetest.com', allowed: true });
        expect(canAccessBulkPublish()).to.be.true;
    });

    it('rejects IMS approval belonging to a different test identity', () => {
        Store.profile.set({ email: 'other@adobetest.com' });
        Store.users.setMeta('imsBulkPublishAccess', { email: 'automation@adobetest.com', allowed: true });
        expect(canAccessBulkPublish()).to.be.false;
    });

    it('keeps test identities denied until IMS approves access even with LDAP admin membership', () => {
        Store.profile.set({ email: 'automation@adobetest.com' });
        Store.users.set([{ userPrincipalName: 'automation@adobetest.com', groups: ['GRP-ODIN-MAS-ADMINS'] }]);
        expect(canAccessBulkPublish()).to.be.false;
    });

    it('does not grant Settings access through IMS Bulk Publish approval', () => {
        Store.profile.set({ email: 'automation@adobetest.com' });
        Store.users.set([]);
        Store.users.setMeta('imsBulkPublishAccess', { email: 'automation@adobetest.com', allowed: true });
        expect(canAccessSettings('acom')).to.be.false;
    });

    it('does not use IMS approval for a lookalike test domain', () => {
        Store.profile.set({ email: 'automation@adobetest.com.example.org' });
        Store.users.set([]);
        Store.users.setMeta('imsBulkPublishAccess', { email: 'automation@adobetest.com.example.org', allowed: true });
        expect(canAccessBulkPublish()).to.be.false;
    });

    it('canAccessBulkPublish denies non-members', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-POWERUSERS'] }]);
        expect(canAccessBulkPublish()).to.be.false;
    });

    it('canAccessBulkPublish allows MAS admins', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ADMINS'] }]);
        expect(canAccessBulkPublish()).to.be.true;
    });

    it('canAccessBulkPublish denies users missing from the membership list', () => {
        Store.profile.set({ email: 'unknown@adobe.com' });
        Store.users.set([]);
        expect(canAccessBulkPublish()).to.be.false;
    });

    it('shows the bulk publish card for a curator', async () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-CURATORS'] }]);
        const element = await fixture(html`<mas-advanced-tools></mas-advanced-tools>`);
        expect(element.shadowRoot.querySelector('sp-icon-publish')).not.to.be.null;
    });

    it('hides the bulk publish card for a non-member', async () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-EDITORS'] }]);
        const element = await fixture(html`<mas-advanced-tools></mas-advanced-tools>`);
        expect(element.shadowRoot.querySelector('sp-icon-publish')).to.be.null;
    });

    it('updates the bulk publish card when membership changes', async () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-EDITORS'] }]);
        const element = await fixture(html`<mas-advanced-tools></mas-advanced-tools>`);
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-CURATORS'] }]);
        await element.updateComplete;
        expect(element.shadowRoot.querySelector('sp-icon-publish')).not.to.be.null;
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

    it('canAccessSettings allows brand-concierge powerusers on their own surface only', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-BRAND-CONCIERGE-POWERUSERS'] }]);
        expect(canAccessSettings('brand-concierge')).to.be.true;
        expect(canAccessMasks('brand-concierge')).to.be.true;
        expect(canAccessOfferMapping('brand-concierge')).to.be.true;

        for (const surface of ['acom', 'ccd', 'commerce']) {
            expect(canAccessSettings(surface)).to.be.false;
            expect(canAccessMasks(surface)).to.be.false;
            expect(canAccessOfferMapping(surface)).to.be.false;
        }
    });

    it('canAccessSettings allows global admins on brand-concierge', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ADMINS'] }]);
        expect(canAccessSettings('brand-concierge')).to.be.true;
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
