import { Layout3Volets } from "@/components/layout/Layout3Volets";
import { CenterEditor } from "@/features/actes/transcription/components/TranscriptionCenterEditor";
import { LeftSidebar } from "@/features/actes/transcription/components/TranscriptionLeftSidebar";
import { RightSidebar } from "@/features/actes/transcription/components/TranscriptionRightSidebar";


export default function TranscriptionEditor({ acteId }: { acteId: string }) {
  return <Layout3Volets
            acteId = {acteId}
            titre={`Transcription de l’acte notarié`}
            Left={<LeftSidebar />}
            Center={<CenterEditor acteId={acteId} />}
            Right={<RightSidebar />}
            leftVisible={true}
            rightVisible={false}
            leftMinSize={20}
            leftMaxSize={25}
            leftInitialCollapsed={false}
            rightMinSize={10}
            rightMaxSize={25}
            rightInitialCollapsed={false}
          />
}
