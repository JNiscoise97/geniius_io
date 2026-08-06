// features/etat-civil/validation/constants.ts
export const ROLES_TOUJOURS_ABSENTS = ['mention', 'défunt'] as const;
export const ROLES_TOUJOURS_PRES = [
  'officier','témoin 1','témoin 2','témoin 3','témoin 4','déclarant','épouse','époux',
] as const;

export const ROLES_PARENTS_COND = [
  'père','mère','époux-père','époux-mère','épouse-père','épouse-mère',
] as const;

export const ROLES_MULTI = ['enfant','enfant légitimé','sujet'] as const;

export const ROLES_AGE_OBLIG = [
  'déclarant','sujet','père','mère','épouse','époux','enfant légitimé','défunt',
  'témoin 1','témoin 2','témoin 3','témoin 4',
] as const;

export const ROLES_FILIATION = ['enfant','épouse','époux','enfant légitimé','défunt'] as const;
