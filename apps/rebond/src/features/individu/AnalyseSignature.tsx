// AnalyseSignature.tsx
import IndividuLigneDeVieTable from './IndividuLigneDeVieTable';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getNarrationSignature } from '@/lib/enrichirNarration';
import { BookOpen, PenLine } from 'lucide-react';

interface AnalyseSignatureProps {
  activeIndividu: any;
  mentions: any[];
}

export default function AnalyseSignature({ activeIndividu, mentions }: AnalyseSignatureProps) {
  const mentionsUtiles = mentions?.filter(
    (m) =>
      m.est_vivant !== false &&
      m.role !== 'enfant' &&
      m.role !== 'enfant légitimé' &&
      m.role !== 'sujet' &&
      m.role !== 'mention' &&
      m.est_present,
  );

  const narration = getNarrationSignature(activeIndividu, mentionsUtiles || []);

  return (
    <div className='space-y-6 px-4 w-full'>
      <Accordion type='multiple' defaultValue={['contexte', 'signatures']}>
        {/* Bloc narratif */}
        <AccordionItem value='contexte'>
          <AccordionTrigger>
            <div className='flex items-center gap-2'>
              <BookOpen className='w-4 h-4 text-muted-foreground' />
              <span>Contexte</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>{narration}</AccordionContent>
        </AccordionItem>

        {/* Bloc signatures */}
        <AccordionItem value='signatures'>
          <AccordionTrigger>
            <div className='flex items-center gap-2'>
              <PenLine className='w-4 h-4 text-muted-foreground' />
              <span>Signatures</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className='w-fit min-w-[50%] overflow-auto'>
              <IndividuLigneDeVieTable
                enrichis={mentionsUtiles}
                visibleColumns={['date', 'acteRaccourci', 'role', 'signature', 'signature_libelle']}
                pageSize={-1}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
