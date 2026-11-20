import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import Store from '../src/store.js';
import {
    canAccessSettings,
    canAccessMasks,
    canAccessOfferMapping,
    canAccessBulkPublish,
    canEditPlaceholders,
    canEditPromotions,
    canManagePromotions,
    isMasAdmin,
} from '../src/groups.js';
import '../src/swc.js';
import '../src/mas-advanced-tools.js';

describe('groups', () => {
    let originalProfile;
    let originalUsers;
    let originalImsAccess;
    let originalSearch;

    beforeEach(() => {
        originalProfile = structuredClone(Store.profile.get());
        originalUsers = structuredClone(Store.users.get());
        originalImsAccess = Store.users.getMeta('imsBulkPublishAccess');
        originalSearch = structuredClone(Store.search.get());
        Store.users.setMeta('imsBulkPublishAccess', null);
    });

    afterEach(() => {
        fixtureCleanup();
        Store.profile.set(originalProfile);
        Store.users.set(originalUsers);
        Store.users.setMeta('imsBulkPublishAccess', originalImsAccess);
        Store.search.set(originalSearch);
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

    for (const surface of ['ccd', 'adobe-home', '/CCD/en_US']) {
        it(`allows CCDAH curators to use bulk publish on ${surface}`, () => {
            Store.profile.set({ email: 'a@adobe.com' });
            Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-CCDAH-CURATORS'] }]);
            expect(canAccessBulkPublish(surface)).to.be.true;
        });

        it(`allows CCDAH curators to edit masks on ${surface}`, () => {
            Store.profile.set({ email: 'a@adobe.com' });
            Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-CCDAH-CURATORS'] }]);
            expect(canAccessMasks(surface)).to.be.true;
        });
    }

    for (const surface of ['acom', 'express', 'ccd-other', '', undefined]) {
        it(`does not grant CCDAH curator capabilities on ${surface}`, () => {
            Store.profile.set({ email: 'a@adobe.com' });
            Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-CCDAH-CURATORS'] }]);
            expect(canAccessBulkPublish(surface)).to.be.false;
            expect(canAccessMasks(surface)).to.be.false;
            expect(canEditPlaceholders(surface)).to.be.false;
        });
    }

    it('does not grant CCDAH curators settings or offer mapping on their surfaces', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-CCDAH-CURATORS'] }]);
        for (const surface of ['ccd', 'adobe-home']) {
            expect(canAccessSettings(surface)).to.be.false;
            expect(canAccessOfferMapping(surface)).to.be.false;
            expect(canEditPlaceholders(surface)).to.be.true;
        }
    });

    it('preserves existing permissions when CCDAH membership is combined with another role', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([
            { userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-CCDAH-CURATORS', 'GRP-ODIN-MAS-ACOM-CURATORS'] },
        ]);
        expect(canAccessBulkPublish('express')).to.be.true;
        expect(canEditPlaceholders('acom')).to.be.true;
    });

    it('does not turn global bulk publish access into global masks access when curator groups are combined', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([
            { userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-CURATORS', 'GRP-ODIN-MAS-CCDAH-CURATORS'] },
        ]);
        expect(canAccessMasks('express')).to.be.false;
    });

    it('preserves independently granted dictionary editing when an Express editor becomes a CCDAH curator', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([
            { userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-EXPRESS-EDITORS', 'GRP-ODIN-MAS-CCDAH-CURATORS'] },
        ]);
        expect(canEditPlaceholders('express')).to.be.true;
    });

    it('does not grant dictionary editing on unrelated surfaces through a different editor membership', () => {
        Store.profile.set({ email: 'a@adobe.com' });
        Store.users.set([
            { userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-CCD-EDITORS', 'GRP-ODIN-MAS-CCDAH-CURATORS'] },
        ]);
        expect(canEditPlaceholders('express')).to.be.false;
    });

    it('restricts IMS-approved CCDAH test users to the approved surfaces', () => {
        Store.profile.set({ email: 'automation@adobetest.com' });
        Store.users.set([]);
        Store.users.setMeta('imsBulkPublishAccess', {
            email: 'automation@adobetest.com',
            allowed: true,
            surfaces: ['ccd', 'adobe-home'],
        });
        expect(canAccessBulkPublish('ccd')).to.be.true;
        expect(canAccessBulkPublish('adobe-home')).to.be.true;
        expect(canAccessBulkPublish('express')).to.be.false;
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

    for (const [from, to, visible] of [
        ['express', 'ccd', true],
        ['ccd', 'express', false],
        ['express', 'adobe-home', true],
        ['adobe-home', 'express', false],
    ]) {
        it(`updates the bulk publish card when CCDAH curators switch from ${from} to ${to}`, async () => {
            Store.profile.set({ email: 'a@adobe.com' });
            Store.users.set([{ userPrincipalName: 'a@adobe.com', groups: ['GRP-ODIN-MAS-CCDAH-CURATORS'] }]);
            Store.search.set((current) => ({ ...current, path: from }));
            const element = await fixture(html`<mas-advanced-tools></mas-advanced-tools>`);
            expect(Boolean(element.shadowRoot.querySelector('sp-icon-publish'))).to.equal(!visible);

            Store.search.set((current) => ({ ...current, path: to }));
            await element.updateComplete;

            expect(Boolean(element.shadowRoot.querySelector('sp-icon-publish'))).to.equal(visible);
        });
    }

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

    for (const { group, edit, manage } of [
        { group: 'GRP-ODIN-MAS-ADMINS', edit: true, manage: true },
        { group: 'GRP-ODIN-MAS-PROMO-EDITORS', edit: true, manage: false },
        { group: 'GRP-ODIN-MAS-PROMO-POWERUSERS', edit: true, manage: true },
        { group: 'grp-odin-mas-promo-powerusers', edit: true, manage: true },
        { group: 'GRP-ODIN-MAS-ACOM-POWERUSERS', edit: false, manage: false },
        { group: 'GRP-ODIN-MAS-EDITORS', edit: false, manage: false },
    ]) {
        it(`grants basic promotion authoring=${edit} for ${group}`, () => {
            Store.profile.set({ email: 'Author@adobe.com' });
            Store.users.set([{ userPrincipalName: 'author@adobe.com', groups: [group] }]);
            expect(canEditPromotions()).to.equal(edit);
        });

        it(`grants advanced promotion authoring=${manage} for ${group}`, () => {
            Store.profile.set({ email: 'Author@adobe.com' });
            Store.users.set([{ userPrincipalName: 'author@adobe.com', groups: [group] }]);
            expect(canManagePromotions()).to.equal(manage);
        });
    }

    it('denies advanced promotion authoring before membership is loaded', () => {
        Store.profile.set({ email: 'author@adobe.com' });
        Store.users.set([]);
        expect(canManagePromotions()).to.be.false;
    });
});
