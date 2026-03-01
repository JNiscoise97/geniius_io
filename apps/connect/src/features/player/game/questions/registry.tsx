//registry.tsx

import type { QuestionType } from "../engine/types";
import { QuestionFill } from "./fill/QuestionFill";
import { QuestionNumeric } from "./numeric/QuestionNumeric";
import { QuestionQCM } from "./qcm/QuestionQCM";
import { QuestionQCU } from "./qcu/QuestionQCU";
import { QuestionShort } from "./short/QuestionShort";
import { QuestionTrueFalse } from "./truefalse/QuestionTrueFalse";
import { QuestionPhoto } from "./photo/QuestionPhoto";

export const registry: Record<QuestionType, any> = {
  qcu: QuestionQCU,
  qcm: QuestionQCM,
  truefalse: QuestionTrueFalse,
  numeric: QuestionNumeric,
  short: QuestionShort,
  fill: QuestionFill,
  photo: QuestionPhoto,
};
