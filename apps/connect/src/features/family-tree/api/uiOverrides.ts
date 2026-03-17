
import tanjamaCoundeaman from "../../../assets/images/tanjama-coundeaman.jpg";
import gromer from "../../../assets/images/gromer.jpg";
import niscoiseJordan from "../../../assets/images/niscoise-jordan.jpg";
import kicheninCandide from "../../../assets/images/kichenin-candide.jpg";
import type { PersonSummary } from "../types";

export type PersonUiOverride = Partial<PersonSummary>;

export const PERSON_UI_OVERRIDES: Record<string, PersonUiOverride> = {
  coundeaman: {
    photoSrc: tanjamaCoundeaman,
    subtitle: "Aïeule",
  },
  7398: {
    subtitle: "Aïeule",
    photoSrc: gromer,
  },
  ariapoutri: {
    subtitle: "Aïeul",
  },
  7351: {
    photoSrc: niscoiseJordan,
    hidden: false,
  },
  731454: {
    photoSrc: kicheninCandide,
  },
};