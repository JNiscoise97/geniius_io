
import tanjamaCoundeaman from "../../../assets/images/tanjama-coundeaman.jpg";
import gromer from "../../../assets/images/gromer.jpg";
import niscoiseJordan from "../../../assets/images/niscoise-jordan.jpg";
import blukerMariot from "../../../assets/images/bluker-mariot.jpg";
import blukerMichel from "../../../assets/images/bluker-michel.jpg";
import kicheninCandide from "../../../assets/images/kichenin-candide.jpg";
import poninAugustine from "../../../assets/images/ponin-augustine.jpg";
import amassyJoseph from "../../../assets/images/amassy-joseph.jpg";
import amassyGermaine from "../../../assets/images/amassy-germaine.jpg";
import amassyMarie from "../../../assets/images/amassy-marie.jpg";
import amassySavamy from "../../../assets/images/amassy-savamy.jpg";
import latchimyNayadou from "../../../assets/images/latchimy-nayadou.jpg";
import poinapinJb from "../../../assets/images/poinapin-jb.jpg";
import sinatambyLouise from "../../../assets/images/sinatamby-louise.jpg";
import sennypalanyElisabeth from "../../../assets/images/sennypalany-elisabeth.jpg";
import type { PersonSummary } from "../types";

export type PersonUiOverride = Partial<PersonSummary>;

export const PERSON_UI_OVERRIDES: Record<string, PersonUiOverride> = {
  "coundeaman": {
    photoSrc: tanjamaCoundeaman,
    subtitle: "Aïeule",
  },
  "7398": {
    subtitle: "Aïeule",
    photoSrc: gromer,
  },
  "ariapoutri": {
    subtitle: "Aïeul",
  },
  "7351": {
    photoSrc: niscoiseJordan,
    hidden: false,
  },
  "733728949": {
    hidden: false,
  },
  "731454": {
    photoSrc: kicheninCandide,
  },
  "731304634": {
    photoSrc: blukerMariot,
  },
  "7372": {
    photoSrc: blukerMichel,
  },
  "73791223": {
    photoSrc: poninAugustine,
  },
  "734260": {
    photoSrc: amassyJoseph,
  },
  "731204398": {
    photoSrc: amassyGermaine,
  },
  "733634214": {
    photoSrc: amassyMarie,
  },
  "734814": {
    photoSrc: amassySavamy,
  },
  "73188768": {
    photoSrc: latchimyNayadou,
  },
  "733730171": {
    photoSrc: poinapinJb,
  },
  "731261074": {
    photoSrc: sinatambyLouise,
  },
  "733631992": {
    photoSrc: sennypalanyElisabeth,
  },
};