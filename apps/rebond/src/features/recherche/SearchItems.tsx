//SearchItems.tsx
import { Link } from 'react-router-dom';
import { ChevronRight, Circle, File, Mars, Venus } from 'lucide-react';
import { formatDateToNumericFrench } from '@/utils/date';
import { highlight } from './highlight';
import { StatusPill } from '@/components/shared/StatusPill';

export function IndividuItem({ item, query }: { item: any; query: string }) {
  return (
    <Link to={`/individu/${item.id}`}>
      <li className="flex items-center justify-between rounded-xl p-3 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 rounded-lg border-2 border-gray-200 shadow-xs text-xl h-10 w-10 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            {item.sexe === 'M' && <Mars className="w-4 h-4 text-blue-500" />}
            {item.sexe === 'F' && <Venus className="w-4 h-4 text-pink-500" />}
            {!['M', 'F'].includes(item.sexe) && <Circle className="w-4 h-4 text-gray-400" />}
          </div>
          <div className="text-gray-900 dark:text-gray-300">
            <div>{highlight(item.label, query)}</div>
            <div className="text-xs text-gray-500">
              {item.naissance_date || item.naissance_lieu
                ? `Né${item.sexe === 'F' ? 'e' : ''} ${item.naissance_date || ''} ${item.naissance_lieu ? `à ${item.naissance_lieu}` : ''}`
                : ''}
              {(item.naissance_date || item.naissance_lieu) && (item.deces_date || item.deces_lieu) ? ' – ' : ''}
              {item.deces_date || item.deces_lieu
                ? `Décédé${item.sexe === 'F' ? 'e' : ''} ${item.deces_date || ''} ${item.deces_lieu ? `à ${item.deces_lieu}` : ''}`
                : ''}
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
      </li>
    </Link>
  );
}

export function MentionItem({ item, query }: { item: any; query: string }) {
  return (
    <Link to={`/${item.source_table === 'etat_civil_actes' ? 'ec' : 'ac'}-acte/${item.acte_id}`}>
      <li className="flex items-center justify-between rounded-xl p-3 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 rounded-lg border-2 border-gray-200 shadow-xs text-xl h-10 w-10 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            {item.sexe === 'M' && <Mars className="w-4 h-4 text-blue-500" />}
            {item.sexe === 'F' && <Venus className="w-4 h-4 text-pink-500" />}
            {!['M', 'F'].includes(item.sexe) && <Circle className="w-4 h-4 text-gray-400" />}
          </div>
          <div className="text-gray-900 dark:text-gray-300">
            <div className="text-xs text-gray-500 leading-snug">
              {item.acte_date && `${formatDateToNumericFrench(item.acte_date)} – `}
              {item.acte_label}
            </div>
            <div>{highlight(item.label, query)}</div>
            <div className="text-xs text-gray-500 leading-snug">
              {item.roleLabel}
              {item.age && item.age !== 'dcd' && ` (${item.age} ans)`}
              {item.age === 'dcd' && ` (${item.age})`}
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
      </li>
    </Link>
  );
}

export function NotaireItem({ item, query }: { item: any; query: string }) {
  return (
    <Link to={`/notaires/${item.id}`}>
      <li className="flex items-center justify-between rounded-xl p-3 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 rounded-lg border-2 border-gray-200 shadow-xs text-xl h-10 w-10 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            {/* Icône tampon déjà importée côté page si tu veux l’ajouter */}
          </div>
          <div className="text-gray-900 dark:text-gray-300">
            <div>{highlight(item.label, query)}</div>
            <div className="text-xs text-gray-500">{item.exercice}</div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
      </li>
    </Link>
  );
}

export function DocumentItem({ item, query }: { item: any; query: string }) {
  return (
    <Link to={`/${item.source_table === 'etat_civil_actes' ? 'ec' : 'ac'}-acte/${item.acte_id}`}>
      <li className="flex items-center justify-between rounded-xl p-3 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 rounded-lg border-2 border-gray-200 shadow-xs text-xl h-10 w-10 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            <File className="w-4 h-4" />
          </div>
          <div className="text-gray-900 dark:text-gray-300">
            <div className="text-xs text-gray-500 leading-snug inline-flex items-center gap-x-2">
              {item.acte_date && `${formatDateToNumericFrench(item.acte_date)}`}
              <StatusPill statut={item.acte_statut || 'à transcrire'} />
            </div>
            <div>{highlight(item.documentLabel, query)}</div>
            <div className="text-xs text-gray-500 leading-snug">
              {item.source_table === 'etat_civil_actes'
                ? `${item.registreLabel} - ${item.bureauLabel}`
                : item.notaireLabel}
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
      </li>
    </Link>
  );
}

export function LieuItem({ item, query }: { item: any; query: string }) {
  const Icon = item.lieuIcon;
  return (
    <Link to={`/lieu/${item.lieu_id}`}>
      <li className="flex items-center justify-between rounded-xl p-3 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 rounded-lg border-2 border-gray-200 shadow-xs text-xl h-10 w-10 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            {Icon && <Icon className="w-4 h-4" />}
          </div>
          <div className="text-gray-900 dark:text-gray-300">
            <div className="text-xs text-gray-500 leading-snug">
              <ol className="flex flex-wrap items-center">
                {item.path_labels?.map((label: string, idx: number) => {
                  const isLeaf = idx === item.path_labels.length - 1;
                  return (
                    <li key={`${label}-${idx}`} className="flex items-center">
                      <span className="max-w-[220px] truncate py-0.5 rounded text-xs border border-transparent text-gray-700" title={label}>
                        {label}
                      </span>
                      {!isLeaf && (
                        <span className="px-1" aria-hidden>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
            <div>{highlight(item.toponyme_libelle, query)}</div>
            {item.mentions_count != null && item.mentions_count > 0 && (
              <div className="text-xs text-gray-500 leading-snug inline-flex items-center gap-x-2">
                {item.nbMentionsLabel}
              </div>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
      </li>
    </Link>
  );
}
