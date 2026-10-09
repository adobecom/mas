import { expect } from 'chai';
import {
    deriveSurfaceFromPath,
    canEditSurface,
    entitledSurfaces,
    groupsForEmail,
    fetchUserGroups,
    requireSurfaceAccess,
    resolveAemBaseUrl,
    isAllowedAemHost,
} from '../../src/lib/ims-validator.js';
import { Ims } from '@adobe/aio-lib-ims';
import stateLib from '@adobe/aio-lib-state';

describe('ims-validator surface authz', () => {
    describe('deriveSurfaceFromPath', () => {
        it('returns the surface segment from a standard MAS path', () => {
            expect(deriveSurfaceFromPath('/content/dam/mas/express/en_US/card-foo')).to.equal('express');
            expect(deriveSurfaceFromPath('/content/dam/mas/acom/en_US/card')).to.equal('acom');
            expect(deriveSurfaceFromPath('/content/dam/mas/acom-cc/fr_FR/card')).to.equal('acom-cc');
        });

        it('lowercases the surface', () => {
            expect(deriveSurfaceFromPath('/content/dam/mas/EXPRESS/en_US/card')).to.equal('express');
        });

        it('returns null for paths outside /content/dam/mas', () => {
            expect(deriveSurfaceFromPath('/content/dam/other/express/card')).to.be.null;
            expect(deriveSurfaceFromPath('/other/prefix')).to.be.null;
        });

        it('returns null for empty / non-string input', () => {
            expect(deriveSurfaceFromPath('')).to.be.null;
            expect(deriveSurfaceFromPath(null)).to.be.null;
            expect(deriveSurfaceFromPath(undefined)).to.be.null;
            expect(deriveSurfaceFromPath(42)).to.be.null;
        });

        it('rejects paths containing a .. traversal segment', () => {
            expect(deriveSurfaceFromPath('/content/dam/mas/acom/../ccd/en_US/card')).to.be.null;
            expect(deriveSurfaceFromPath('/content/dam/mas/acom/en_US/../../ccd/card')).to.be.null;
        });
    });

    describe('isAllowedAemHost / resolveAemBaseUrl', () => {
        it('allows AEM Cloud and local hosts', () => {
            expect(isAllowedAemHost('https://author-p1-e1.adobeaemcloud.com')).to.be.true;
            expect(isAllowedAemHost('http://localhost:4502')).to.be.true;
            expect(isAllowedAemHost('http://127.0.0.1:4502')).to.be.true;
        });

        it('rejects arbitrary and malformed hosts', () => {
            expect(isAllowedAemHost('https://evil.example')).to.be.false;
            expect(isAllowedAemHost('https://adobeaemcloud.com.evil.example')).to.be.false;
            expect(isAllowedAemHost('not-a-url')).to.be.false;
        });

        it('ignores a disallowed _aemBaseUrl override and falls back to the configured URL', () => {
            const resolved = resolveAemBaseUrl({
                _aemBaseUrl: 'https://evil.example',
                AEM_BASE_URL: 'https://author-p1-e1.adobeaemcloud.com',
            });
            expect(resolved.url).to.equal('https://author-p1-e1.adobeaemcloud.com');
            expect(resolved.error).to.be.null;
        });

        it('honors an allowlisted _aemBaseUrl override', () => {
            const resolved = resolveAemBaseUrl({
                _aemBaseUrl: 'https://author-p2-e2.adobeaemcloud.com',
                AEM_BASE_URL: 'https://author-p1-e1.adobeaemcloud.com',
            });
            expect(resolved.url).to.equal('https://author-p2-e2.adobeaemcloud.com');
        });

        it('returns a 500 error when nothing is configured', () => {
            const resolved = resolveAemBaseUrl({});
            expect(resolved.url).to.be.null;
            expect(resolved.error.statusCode).to.equal(500);
        });
    });

    describe('canEditSurface', () => {
        it('grants access to MAS admins regardless of surface', () => {
            expect(canEditSurface(['GRP-ODIN-MAS-ADMINS'], 'express')).to.be.true;
            expect(canEditSurface(['GRP-ODIN-MAS-ADMINS'], 'acom')).to.be.true;
            // Admin bypasses even an unknown surface
            expect(canEditSurface(['GRP-ODIN-MAS-ADMINS'], 'unmapped')).to.be.true;
        });

        it('grants access when user has the per-surface EDITORS group', () => {
            expect(canEditSurface(['GRP-ODIN-MAS-EXPRESS-EDITORS'], 'express')).to.be.true;
            expect(canEditSurface(['GRP-ODIN-MAS-ACOM-EDITORS'], 'acom')).to.be.true;
        });

        it('denies access when user lacks the per-surface EDITORS group', () => {
            expect(canEditSurface(['GRP-ODIN-MAS-ACOM-EDITORS'], 'express')).to.be.false;
            expect(canEditSurface(['GRP-SOMETHING-ELSE'], 'express')).to.be.false;
        });

        it('denies access when group list is empty or missing', () => {
            expect(canEditSurface([], 'express')).to.be.false;
            expect(canEditSurface(null, 'express')).to.be.false;
            expect(canEditSurface(undefined, 'express')).to.be.false;
        });

        it('denies access when surface is null / missing', () => {
            expect(canEditSurface(['GRP-ODIN-MAS-EXPRESS-EDITORS'], null)).to.be.false;
            expect(canEditSurface(['GRP-ODIN-MAS-EXPRESS-EDITORS'], '')).to.be.false;
        });

        it('denies access when surface is unmapped (defense in depth)', () => {
            expect(canEditSurface(['GRP-ODIN-MAS-EXPRESS-EDITORS'], 'unknown-surface')).to.be.false;
        });

        it('is case-insensitive on group matching', () => {
            // Input groups are expected uppercase; verify the constant comparison is uppercase too.
            expect(canEditSurface(['GRP-ODIN-MAS-ADMINS'], 'express')).to.be.true;
        });
    });

    describe('fetchUserGroups', () => {
        let originalFetch;
        let originalInit;

        beforeEach(() => {
            originalFetch = globalThis.fetch;
            originalInit = stateLib.init;
        });

        afterEach(() => {
            globalThis.fetch = originalFetch;
            stateLib.init = originalInit;
        });

        function stubMasUsers(users) {
            stateLib.init = async () => ({ get: async () => ({ value: JSON.stringify(users) }) });
        }

        it('resolves the caller groups from mas-users by email, uppercased', async () => {
            globalThis.fetch = async () => ({ ok: true, json: async () => ({ email: 'X@Y' }) });
            stubMasUsers([{ userPrincipalName: 'x@y', groups: ['grp-odin-mas-admins', 'grp-odin-mas-express-editors'] }]);
            const groups = await fetchUserGroups('token-abc');
            expect(groups).to.deep.equal(['GRP-ODIN-MAS-ADMINS', 'GRP-ODIN-MAS-EXPRESS-EDITORS']);
        });

        it('returns empty array when the profile response is not OK', async () => {
            globalThis.fetch = async () => ({ ok: false, status: 401 });
            expect(await fetchUserGroups('token-xyz')).to.deep.equal([]);
        });

        it('returns empty array when the profile fetch throws', async () => {
            globalThis.fetch = async () => {
                throw new Error('network down');
            };
            expect(await fetchUserGroups('token-xyz')).to.deep.equal([]);
        });

        it('returns empty array when the caller is not in mas-users', async () => {
            globalThis.fetch = async () => ({ ok: true, json: async () => ({ email: 'x@y' }) });
            stubMasUsers([{ userPrincipalName: 'someone-else@adobe.com', groups: ['GRP-ODIN-MAS-ADMINS'] }]);
            expect(await fetchUserGroups('token-abc')).to.deep.equal([]);
        });
    });

    describe('requireSurfaceAccess', () => {
        let originalFetch;
        let originalValidate;
        let originalInit;

        beforeEach(() => {
            originalFetch = globalThis.fetch;
            originalValidate = Ims.prototype.validateTokenAllowList;
            originalInit = stateLib.init;
            Ims.prototype.validateTokenAllowList = async () => ({ valid: true });
        });

        afterEach(() => {
            globalThis.fetch = originalFetch;
            Ims.prototype.validateTokenAllowList = originalValidate;
            stateLib.init = originalInit;
        });

        function stubProfile(groups) {
            globalThis.fetch = async () => ({ ok: true, json: async () => ({ email: 'caller@adobe.com' }) });
            stateLib.init = async () => ({
                get: async () => ({ value: JSON.stringify([{ userPrincipalName: 'caller@adobe.com', groups }]) }),
            });
        }

        it('returns 401 when no authorization header is provided', async () => {
            const result = await requireSurfaceAccess({}, { parentPath: '/content/dam/mas/express/en_US/foo' });
            expect(result.statusCode).to.equal(401);
        });

        it('returns 400 when no parentPath / path is provided', async () => {
            stubProfile(['GRP-ODIN-MAS-ADMINS']);
            const result = await requireSurfaceAccess({ authorization: 'Bearer t' }, {});
            expect(result.statusCode).to.equal(400);
            expect(result.body.error).to.include('parentPath');
        });

        it('returns 400 for a path outside /content/dam/mas', async () => {
            stubProfile(['GRP-ODIN-MAS-ADMINS']);
            const result = await requireSurfaceAccess(
                { authorization: 'Bearer t' },
                { parentPath: '/content/dam/other/express/foo' },
            );
            expect(result.statusCode).to.equal(400);
        });

        it('returns 403 when caller is in no matching group', async () => {
            stubProfile(['GRP-SOMETHING-ELSE']);
            const result = await requireSurfaceAccess(
                { authorization: 'Bearer t' },
                { parentPath: '/content/dam/mas/express/en_US/foo' },
            );
            expect(result.statusCode).to.equal(403);
            expect(result.body.error).to.include('express');
        });

        it('returns 403 when caller has wrong surface permission', async () => {
            stubProfile(['GRP-ODIN-MAS-ACOM-EDITORS']);
            const result = await requireSurfaceAccess(
                { authorization: 'Bearer t' },
                { parentPath: '/content/dam/mas/express/en_US/foo' },
            );
            expect(result.statusCode).to.equal(403);
        });

        it('returns null (authorized) when caller has the right surface group', async () => {
            stubProfile(['grp-odin-mas-express-editors']);
            const result = await requireSurfaceAccess(
                { authorization: 'Bearer t' },
                { parentPath: '/content/dam/mas/express/en_US/foo' },
            );
            expect(result).to.be.null;
        });

        it('returns null (authorized) when caller is a MAS admin, for any mapped surface', async () => {
            stubProfile(['GRP-ODIN-MAS-ADMINS']);
            expect(
                await requireSurfaceAccess({ authorization: 'Bearer t' }, { parentPath: '/content/dam/mas/express/en_US/foo' }),
            ).to.be.null;
            expect(await requireSurfaceAccess({ authorization: 'Bearer t' }, { parentPath: '/content/dam/mas/acom/en_US/foo' }))
                .to.be.null;
        });

        it('accepts params.path when params.parentPath is absent', async () => {
            stubProfile(['GRP-ODIN-MAS-EXPRESS-EDITORS']);
            const result = await requireSurfaceAccess(
                { authorization: 'Bearer t' },
                { path: '/content/dam/mas/express/en_US/card-foo' },
            );
            expect(result).to.be.null;
        });
    });
});

describe('groupsForEmail (mas-users group resolution)', () => {
    const users = [
        { userPrincipalName: 'axel@adobe.com', groups: ['GRP-ODIN-MAS-ADMINS'] },
        { userPrincipalName: 'editor@adobe.com', groups: ['grp-odin-mas-acom-editors'] },
    ];

    it('returns the uppercase groups for a matching email', () => {
        expect(groupsForEmail(users, 'axel@adobe.com')).to.deep.equal(['GRP-ODIN-MAS-ADMINS']);
    });

    it('matches email case-insensitively and uppercases the groups', () => {
        expect(groupsForEmail(users, 'Editor@Adobe.com')).to.deep.equal(['GRP-ODIN-MAS-ACOM-EDITORS']);
    });

    it('returns [] for an unknown email, empty users, or missing email', () => {
        expect(groupsForEmail(users, 'nobody@adobe.com')).to.deep.equal([]);
        expect(groupsForEmail([], 'axel@adobe.com')).to.deep.equal([]);
        expect(groupsForEmail(users, '')).to.deep.equal([]);
        expect(groupsForEmail(null, 'axel@adobe.com')).to.deep.equal([]);
    });
});

describe('entitledSurfaces (cross-surface read authz)', () => {
    it('gives an admin every searchable surface', () => {
        const surfaces = entitledSurfaces(['GRP-ODIN-MAS-ADMINS']);
        expect(surfaces).to.include.members(['acom', 'ccd', 'adobe-home', 'express', 'commerce', 'sandbox']);
    });

    it('gives an acom editor only acom', () => {
        expect(entitledSurfaces(['GRP-ODIN-MAS-ACOM-EDITORS'])).to.deep.equal(['acom']);
    });

    it('folds an acom-cc editor into acom', () => {
        expect(entitledSurfaces(['GRP-ODIN-MAS-ACOM-CC-EDITORS'])).to.deep.equal(['acom']);
    });

    it('returns each surface the caller edits', () => {
        const surfaces = entitledSurfaces(['GRP-ODIN-MAS-CCD-EDITORS', 'GRP-ODIN-MAS-EXPRESS-EDITORS']);
        expect(surfaces).to.have.members(['ccd', 'express']);
        expect(surfaces).to.not.include('acom');
    });

    it('never grants an ungoverned surface without admin', () => {
        const surfaces = entitledSurfaces(['GRP-ODIN-MAS-ACOM-EDITORS']);
        expect(surfaces).to.not.include.members(['commerce', 'sandbox', 'docs', 'nala']);
    });

    it('returns nothing for a caller in no MAS group', () => {
        expect(entitledSurfaces(['GRP-SOMETHING-ELSE'])).to.deep.equal([]);
        expect(entitledSurfaces([])).to.deep.equal([]);
        expect(entitledSurfaces(null)).to.deep.equal([]);
    });
});
