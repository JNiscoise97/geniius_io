
import tanjamaCoundeaman from "../../../assets/images/tanjama-coundeaman.jpg";
import tanjamaCanou from "../../../assets/images/tanjama-canou.jpg";
import tanjamaManicon from "../../../assets/images/tanjama-manicon.jpg";
import tanjamaSavoupaquiom from "../../../assets/images/tanjama-savoupaquiom.jpg";
import gromer from "../../../assets/images/gromer.jpg";
import alyJerome from "../../../assets/images/aly-jerome.jpg";
import niscoiseJordan from "../../../assets/images/niscoise-jordan.jpg";
import blukerMariot from "../../../assets/images/bluker-mariot.jpg";
import blukerMichel from "../../../assets/images/bluker-michel.jpg";
import blukerRaymond from "../../../assets/images/bluker-raymond.jpg";
import blukerEmmanuel from "../../../assets/images/bluker-emmanuel.jpg";
import dassachettyVivienne from "../../../assets/images/dassachetty-vivienne.jpg";
import dassachettySouprayen from "../../../assets/images/dassachetty-souprayen.jpg";
import kicheninCandide from "../../../assets/images/kichenin-candide.jpg";
import poninAugustine from "../../../assets/images/ponin-augustine.jpg";
import amassyJoseph from "../../../assets/images/amassy-joseph.jpg";
import amassyGermaine from "../../../assets/images/amassy-germaine.jpg";
import amassyMarie from "../../../assets/images/amassy-marie.jpg";
import amassySavamy from "../../../assets/images/amassy-savamy.jpg";
import blukerDaniel from "../../../assets/images/bluker-daniel.jpg";
import blukerElianne from "../../../assets/images/bluker-elianne.jpg";
import blukerGaston from "../../../assets/images/bluker-gaston.jpg";
import blukerPaula from "../../../assets/images/bluker-paula.jpg";
import blukerRene from "../../../assets/images/bluker-rene.jpg";
import caletyMadeleine from "../../../assets/images/calety-madeleine.jpg";
import caletyStenie from "../../../assets/images/calety-stenie.jpg";
import caletyGaby from "../../../assets/images/calety-gaby.jpg";
import caletyLouis from "../../../assets/images/calety-louis.jpg";
import caletyRoland from "../../../assets/images/calety-roland.jpg";
import dassachettySoubaya from "../../../assets/images/dassachetty-soubaya.jpg";
import dassachettyFelicien from "../../../assets/images/dassachetty-felicien.jpg";
import gaspNoeline from "../../../assets/images/gasp-noeline.jpg";
import latchimyNayadou from "../../../assets/images/latchimy-nayadou.jpg";
import mardemoutouFelicien from "../../../assets/images/mardemoutou-felicien.jpg";
import mammosaValerie from "../../../assets/images/mammosa-valerie.jpg";
import piterbothMarthe from "../../../assets/images/piterboth-marthe.jpg";
import poinapinJb from "../../../assets/images/poinapin-jb.jpg";
import poninPierre from "../../../assets/images/ponin-pierre.jpg";
import poutaredyJoseph from "../../../assets/images/poutaredy-joseph.jpg";
import poutaredyScholastique from "../../../assets/images/poutaredy-scholastique.jpg";
import ramanyAimee from "../../../assets/images/ramany-aimee.jpg";
import ringuinAndre from "../../../assets/images/ringuin-andre.jpg";
import sadeyenAngelo from "../../../assets/images/sadeyen-angelo.jpg";
import sadeyenEmmanuel from "../../../assets/images/sadeyen-emmanuel.jpg";
import sadeyenJosephine from "../../../assets/images/sadeyen-josephine.jpg";
import sandanceJoseph from "../../../assets/images/sandance-joseph.jpg";
import sinatambyChristophe from "../../../assets/images/sinatamby-christophe.jpg";
import sinatambyLouise from "../../../assets/images/sinatamby-louise.jpg";
import sennypalanyElisabeth from "../../../assets/images/sennypalany-elisabeth.jpg";
import tandiamaJoseph from "../../../assets/images/tandiama-joseph.jpg";
import tanjamaAdrien from "../../../assets/images/tanjama-adrien.jpg";
import tanjamaAndre from "../../../assets/images/tanjama-andre.jpg";
import tanjamaChristiane from "../../../assets/images/tanjama-christiane.jpg";
import tanjamaDavid from "../../../assets/images/tanjama-david.jpg";
import tanjamaJeanne from "../../../assets/images/tanjama-jeanne.jpg";
import tanjamaMarie from "../../../assets/images/tanjama-marie.jpg";
import tanjamaOlivier from "../../../assets/images/tanjama-olivier.jpg";
import tanjamaRaphael from "../../../assets/images/tanjama-raphael.jpg";
import tanjamaRisla from "../../../assets/images/tanjama-risla.jpg";
import tanjamaRoger from "../../../assets/images/tanjama-roger.jpg";
import tanjamaSamy from "../../../assets/images/tanjama-samy.jpg";
import tanjamaStella from "../../../assets/images/tanjama-stella.jpg";
import tanjamaVirginie from "../../../assets/images/tanjama-virginie.jpg";
import tiohonoueLeonus from "../../../assets/images/tiohonoue-leonus.jpg";
import viramaSeraphin from "../../../assets/images/virama-seraphin.jpg";
import viramaAlbert from "../../../assets/images/virama-albert.jpg";
import viramaAndre from "../../../assets/images/virama-andre.jpg";
import viramaAugusta from "../../../assets/images/virama-augusta.jpg";
import viramaEtienne from "../../../assets/images/virama-etienne.jpg";
import viramaEugenie from "../../../assets/images/virama-eugenie.jpg";
import viramaBebe from "../../../assets/images/virama-bébé.jpg";
import viramaCelestin from "../../../assets/images/virama-celestin.jpg";
import viramaClairette from "../../../assets/images/virama-clairette.jpg";
import viramaMadeleine from "../../../assets/images/virama-madeleine.jpg";
import viramaOlivienne from "../../../assets/images/virama-olivienne.jpg";
import viramaRaymond from "../../../assets/images/virama-raymond.jpg";
import viramaRoger from "../../../assets/images/virama-roger.jpg";
import viramaVivienne from "../../../assets/images/virama-vivienne.jpg";

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
  "7391": {
    photoSrc: tanjamaCoundeaman,
  },
  "732469": {
    photoSrc: tanjamaManicon,
  },
  "732470": {
    photoSrc: tanjamaCanou,
  },
  "732467": {
    photoSrc: tanjamaSavoupaquiom,
  },
  "733631992": {
    photoSrc: sennypalanyElisabeth,
  },
  "7390": {
    photoSrc: blukerEmmanuel,
  },
  "734199": {
    photoSrc: dassachettyVivienne,
  },
  "732507": {
    photoSrc: viramaEtienne,
  },
  "73791161": {
    photoSrc: viramaSeraphin,
  },
  "732516": {
    photoSrc: viramaAlbert,
  },
  "73188568": {
    photoSrc: viramaBebe,
  },
  "734815": {
    photoSrc: viramaCelestin,
  },
  "73875778": {
    photoSrc: viramaClairette,
  },
  "732520": {
    photoSrc: viramaEugenie,
  },
  "731271001": {
    photoSrc: viramaMadeleine,
  },
  "732512": {
    photoSrc: viramaRaymond,
  },
  "732518": {
    photoSrc: viramaRoger,
  },
  "733581478": {
    photoSrc: tiohonoueLeonus,
  },
  "731276286": {
    photoSrc: alyJerome,
  },
  "731276274": {
    photoSrc: gaspNoeline,
  },
  "734622": {
    photoSrc: ramanyAimee,
  },
  "73188584": {
    photoSrc: tandiamaJoseph,
  },
  "733597133": {
    photoSrc: caletyRoland,
  },
  "73334": {
    photoSrc: blukerRaymond,
  },
  "733719850": {
    photoSrc: dassachettySouprayen,
  },
  "732718": {
    photoSrc: poutaredyJoseph,
  },
  "732504": {
    photoSrc: mardemoutouFelicien,
  },
  "732711": {
    photoSrc: poutaredyScholastique,
  },
  "732719": {
    photoSrc: ringuinAndre,
  },
  "731336294": {
    photoSrc: tanjamaAdrien,
  },
  "731336298": {
    photoSrc: tanjamaChristiane,
  },
  "733580767": {
    photoSrc: tanjamaMarie,
  },
  "732493": {
    photoSrc: tanjamaVirginie,
  },
  "731465": {
    photoSrc: tanjamaOlivier,
  },
  "732491": {
    photoSrc: tanjamaJeanne,
  },
  "732523": {
    photoSrc: tanjamaAndre,
  },
  "732526": {
    photoSrc: tanjamaRoger,
  },
  "734479": {
    photoSrc: sadeyenAngelo,
  },
  "732502": {
    photoSrc: sadeyenEmmanuel,
  },
  "732505": {
    photoSrc: sadeyenJosephine,
  },
  "732497": {
    photoSrc: caletyStenie,
  },
  "732501": {
    photoSrc: caletyMadeleine,
  },
  "732498": {
    photoSrc: caletyGaby,
  },
  "732500": {
    photoSrc: caletyLouis,
  },
  "7393": {
    photoSrc: blukerGaston,
  },
  "7396": {
    photoSrc: blukerPaula,
  },
  "732788": {
    photoSrc: dassachettySoubaya,
  },
  "732546": {
    photoSrc: tanjamaStella,
  },
  "733719543": {
    photoSrc: sinatambyChristophe,
  },
  "732522": {
    photoSrc: tanjamaRaphael,
  },
  "731270996": {
    photoSrc: viramaVivienne,
  },
  "7395": {
    photoSrc: blukerElianne,
  },
  "7392": {
    photoSrc: blukerRene,
  },
  "73791152": {
    photoSrc: viramaAndre,
  },
  "73306": {
    photoSrc: sandanceJoseph,
  },
  "733581232": {
    photoSrc: viramaAugusta,
  },
  "733581226": {
    photoSrc: viramaOlivienne,
  },
  "733582083": {
    photoSrc: tanjamaSamy,
  },
  "733581149": {
    photoSrc: tanjamaRisla,
  },
  "732524": {
    photoSrc: tanjamaDavid,
  },
  "732494": {
    photoSrc: poninPierre,
  },
  "73304": {
    photoSrc: piterbothMarthe,
  },
  "732722": {
    photoSrc: dassachettyFelicien,
  },
  "7374": {
    photoSrc: blukerDaniel,
  },
  "7373": {
    photoSrc: mammosaValerie,
  },
};