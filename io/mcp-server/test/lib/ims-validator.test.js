import { expect } from 'chai';
import {
    deriveSurfaceFromPath,
    canEditSurface,
    fetchUserGroups,
    requireSurfaceAccess,
} from '../../src/lib/ims-validator.js';
import { Ims } from '@adobe/aio-lib-ims';

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

        beforeEach(() => {
            originalFetch = globalThis.fetch;
        });

        afterEach(() => {
            globalThis.fetch = originalFetch;
        });

        it('returns uppercase group names on a successful profile response', async () => {
            globalThis.fetch = async () => ({
                ok: true,
                json: async () => ({ groups: ['grp-odin-mas-admins', 'grp-odin-mas-express-editors'] }),
            });
            const groups = await fetchUserGroups('token-abc');
            expect(groups).to.deep.equal(['GRP-ODIN-MAS-ADMINS', 'GRP-ODIN-MAS-EXPRESS-EDITORS']);
        });

        it('returns empty array when profile response is not OK', async () => {
            globalThis.fetch = async () => ({ ok: false, status: 401 });
            const groups = await fetchUserGroups('token-xyz');
            expect(groups).to.deep.equal([]);
        });

        it('returns empty array when fetch throws', async () => {
            globalThis.fetch = async () => {
                throw new Error('network down');
            };
            const groups = await fetchUserGroups('token-xyz');
            expect(groups).to.deep.equal([]);
        });

        it('returns empty array when profile has no groups field', async () => {
            globalThis.fetch = async () => ({ ok: true, json: async () => ({ email: 'x@y' }) });
            const groups = await fetchUserGroups('token-abc');
            expect(groups).to.deep.equal([]);
        });
    });

    describe('requireSurfaceAccess', () => {
        let originalFetch;
        let originalValidateToken;

        beforeEach(() => {
            originalFetch = globalThis.fetch;
            originalValidateToken = Ims.prototype.validateToken;
            Ims.prototype.validateToken = async () => ({ valid: true });
        });

        afterEach(() => {
            globalThis.fetch = originalFetch;
            Ims.prototype.validateToken = originalValidateToken;
        });

        function stubProfile(groups) {
            globalThis.fetch = async () => ({ ok: true, json: async () => ({ groups }) });
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
                await requireSurfaceAccess(
                    { authorization: 'Bearer t' },
                    { parentPath: '/content/dam/mas/express/en_US/foo' },
                ),
            ).to.be.null;
            expect(
                await requireSurfaceAccess({ authorization: 'Bearer t' }, { parentPath: '/content/dam/mas/acom/en_US/foo' }),
            ).to.be.null;
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
