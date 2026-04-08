import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FamilyTreeHubPage } from "./FamilyTreeHubPage";
import { FamilyTreeIntroView } from "./FamilyTreeIntroView";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { getDefaultFamilyTreeIntroPrefs, getFamilyTreeIntroPrefs, type FamilyTreeIntroPrefs } from "../data/preferences/getFamilyTreeIntroPrefs";
import { saveFamilyTreeIntroPrefs } from "../data/preferences/saveFamilyTreeIntroPrefs";

export function FamilyTreeEntryPage() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [values, setValues] = useState<FamilyTreeIntroPrefs>(
    getDefaultFamilyTreeIntroPrefs(),
  );

  useEffect(() => {
    let isMounted = true;

    async function loadPrefs() {
      const participantSession = getParticipantSession(slug);

      if (!participantSession?.participantId) {
        if (!isMounted) return;
        const defaults = getDefaultFamilyTreeIntroPrefs();
        setValues(defaults);
        setShowIntro(true);
        setLoading(false);
        return;
      }

      try {
        const prefs = await getFamilyTreeIntroPrefs({
          participantId: participantSession.participantId,
        });

        if (!isMounted) return;

        setValues(prefs);
        setShowIntro(!prefs.hideNextTime);
      } catch {
        if (!isMounted) return;

        const defaults = getDefaultFamilyTreeIntroPrefs();
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

  async function handleContinue(nextValues: FamilyTreeIntroPrefs) {
    const participantSession = getParticipantSession(slug);

    if (participantSession?.participantId) {
      try {
        await saveFamilyTreeIntroPrefs({
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
      <FamilyTreeIntroView
        values={values}
        onChange={setValues}
        onContinue={() => void handleContinue(values)}
      />
    );
  }

  return <FamilyTreeHubPage />;
}