import { TOKEN_KEYS, createTokenStorage } from '@medcord/core';

const storage = createTokenStorage();

export const tokenStorage = {
  getAccess: () => storage.get(TOKEN_KEYS.ACCESS),
  getRefresh: () => storage.get(TOKEN_KEYS.REFRESH),
  setAccess: (token: string) => storage.set(TOKEN_KEYS.ACCESS, token),
  setRefresh: (token: string) => storage.set(TOKEN_KEYS.REFRESH, token),
  setTokens: (access: string, refresh: string) => {
    storage.set(TOKEN_KEYS.ACCESS, access);
    storage.set(TOKEN_KEYS.REFRESH, refresh);
  },
  clearTokens: () => {
    storage.remove(TOKEN_KEYS.ACCESS);
    storage.remove(TOKEN_KEYS.REFRESH);
  },
};
