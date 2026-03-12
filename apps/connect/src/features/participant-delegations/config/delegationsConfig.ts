export type DelegationsConfig = {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyText: string;
  managedByMeLabel: string;
  switchLabel: string;
};

export const delegationsConfig: DelegationsConfig = {
  title: "Profils que je gère",
  subtitle:
    "Retrouve ici les profils que tu gères en plus du tien et bascule facilement de l’un à l’autre.",
  emptyTitle: "Aucun profil géré pour le moment",
  emptyText:
    "Lorsque tu créeras ou ouvriras le profil d’un proche depuis cet appareil, il pourra apparaître ici.",
  managedByMeLabel: "Profil géré par moi",
  switchLabel: "Ouvrir ce profil",
};