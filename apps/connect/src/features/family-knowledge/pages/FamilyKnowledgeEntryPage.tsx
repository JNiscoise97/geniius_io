import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getDefaultFamilyKnowledgeIntroPrefs,
  getFamilyKnowledgeIntroPrefs,
  type FamilyKnowledgeIntroPrefs,
} from "../api/getFamilyKnowledgeIntroPrefs";
import { saveFamilyKnowledgeIntroPrefs } from "../api/saveFamilyKnowledgeIntroPrefs";
import { FamilyKnowledgeHubPage } from "./FamilyKnowledgeHubPage";
import { FamilyKnowledgeIntroView } from "./FamilyKnowledgeIntroView";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";

export function FamilyKnowledgeEntryPage() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [values, setValues] = useState<FamilyKnowledgeIntroPrefs>(
    getDefaultFamilyKnowledgeIntroPrefs(),
  );

  useEffect(() => {
    let isMounted = true;

    async function loadPrefs() {
      const participantSession = getParticipantSession(slug);

      if (!participantSession?.participantId) {
        if (!isMounted) return;
        const defaults = getDefaultFamilyKnowledgeIntroPrefs();
        setValues(defaults);
        setShowIntro(true);
        setLoading(false);
        return;
      }

      try {
        const prefs = await getFamilyKnowledgeIntroPrefs({
          participantId: participantSession.participantId,
        });

        if (!isMounted) return;

        setValues(prefs);
        setShowIntro(!prefs.hideNextTime);
      } catch {
        if (!isMounted) return;

        const defaults = getDefaultFamilyKnowledgeIntroPrefs();
        setValues(defaults);
        setShowIntro(true);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadPrefs();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  async function handleContinue(nextValues: FamilyKnowledgeIntroPrefs) {
    const participantSession = getParticipantSession(slug);

    if (participantSession?.participantId) {
      try {
        await saveFamilyKnowledgeIntroPrefs({
          participantId: participantSession.participantId,
          values: nextValues,
        });
      } catch {
        // on laisse quand même l'utilisateur continuer
      }
    }

    setValues(nextValues);
    setShowIntro(false);
  }

  if (loading) return null;

  if (showIntro) {
    return (
      <FamilyKnowledgeIntroView
        values={values}
        onChange={setValues}
        onContinue={() => void handleContinue(values)}
      />
    );
  }

  return <FamilyKnowledgeHubPage />;
}