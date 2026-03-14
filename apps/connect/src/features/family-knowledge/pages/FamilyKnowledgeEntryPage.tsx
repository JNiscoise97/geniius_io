import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getFamilyKnowledgeIntroPrefs,
  type FamilyKnowledgeIntroPrefs,
} from "../api/getFamilyKnowledgeIntroPrefs";
import { saveFamilyKnowledgeIntroPrefs } from "../api/saveFamilyKnowledgeIntroPrefs";
import { FamilyKnowledgeHubPage } from "./FamilyKnowledgeHubPage";
import { FamilyKnowledgeIntroView } from "./FamilyKnowledgeIntroView";

export function FamilyKnowledgeEntryPage() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [values, setValues] = useState<FamilyKnowledgeIntroPrefs>({
    hideNextTime: false,
  });

  useEffect(() => {
    const prefs = getFamilyKnowledgeIntroPrefs(slug);
    setValues(prefs);
    setShowIntro(!prefs.hideNextTime);
    setLoading(false);
  }, [slug]);

  function handleContinue(nextValues: FamilyKnowledgeIntroPrefs) {
    saveFamilyKnowledgeIntroPrefs({
      slug,
      values: nextValues,
    });

    setValues(nextValues);
    setShowIntro(false);
  }

  if (loading) return null;

  if (showIntro) {
    return (
      <FamilyKnowledgeIntroView
        values={values}
        onChange={setValues}
        onContinue={() => handleContinue(values)}
      />
    );
  }

  return <FamilyKnowledgeHubPage />;
}