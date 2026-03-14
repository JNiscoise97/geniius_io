import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FamilyKnowledgeIntroView } from "./FamilyKnowledgeIntroView";
import {
  getFamilyKnowledgeIntroPrefs,
  type FamilyKnowledgeIntroPrefs,
} from "../api/getFamilyKnowledgeIntroPrefs";
import { saveFamilyKnowledgeIntroPrefs } from "../api/saveFamilyKnowledgeIntroPrefs";

export function FamilyKnowledgeIntroPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<FamilyKnowledgeIntroPrefs>({
    hideNextTime: false,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setValues(getFamilyKnowledgeIntroPrefs(slug));
  }, [slug]);

  function onContinue() {
    saveFamilyKnowledgeIntroPrefs({
      slug,
      values,
    });

    nav(`/e/${slug}/family-knowledge`);
  }

  return (
    <FamilyKnowledgeIntroView
      values={values}
      onChange={setValues}
      onContinue={onContinue}
    />
  );
}