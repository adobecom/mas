import Store from './store.js';

const GRP_ODIN_MAS_POWERUSERS = 'GRP-ODIN-MAS-POWERUSERS';
const GRP_ODIN_MAS_ADMINS = 'GRP-ODIN-MAS-ADMINS';

export function isPowerUser() {
    const { email } = Store.profile.get();
    if (!email) return false;
    const user = Store.users.get().find((user) => user.userPrincipalName === email);
    if (!user) return false;
    return user.groups.includes(GRP_ODIN_MAS_POWERUSERS) || user.groups.includes(GRP_ODIN_MAS_ADMINS);
}
