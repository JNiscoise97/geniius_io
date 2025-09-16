// AnalyseFormulaireActeur.tsx

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import type { ActeurFields, Entity } from '@/types/analyse';
import { sanitizeActeurFields } from '@/store/useEntityStore';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export const defaultActeurFields: ActeurFields = {
  label: '',
  nom: '',
  prenom: '',
  role: '',
  lien: '',
  qualite: '',
  profession_brut: '',
  statut_brut: '',
  fonction: '',
  domicile: '',
  age: '',
  sexe: '',
  est_vivant: null,
  est_present: null,
  a_signe: null,
  note: '',
};

export function AnalyseFormulaireActeur({
  entity,
  mode = 'create',
  onChange,
}: {
  mode?: 'create' | 'edit';
  entity?: Entity;
  onChange?: (value: {
    label: string;
    mapping: {
      cible_type: 'acteur';
      acteur: Omit<ActeurFields, 'label'>;
    };
  }) => void;
}) {
  const [fields, setFields] = useState<ActeurFields>(defaultActeurFields);

  useEffect(() => {
    if (entity && (mode === 'edit' || mode === 'create')) {
      const rawActeur = (entity.mapping?.acteur || {}) as Partial<ActeurFields>;
      const { label } = entity;

      const updatedFields: ActeurFields = {
        ...defaultActeurFields,
        ...rawActeur,
        label,
      };

      setFields(updatedFields);
      emitChange(updatedFields);
    }
  }, [entity, mode]);

  const emitChange = (newFields: ActeurFields) => {
    const { label } = newFields;
    const acteurFields = sanitizeActeurFields(newFields);

    onChange?.({
      label,
      mapping: {
        cible_type: 'acteur',
        acteur: acteurFields,
      },
    });
  };

  const handleChange = (key: keyof ActeurFields, value: string | boolean | null) => {
    const updated = { ...fields, [key]: value };

    setFields(updated);
    emitChange(updated);
  };

  return (
    <div className='space-y-6'>
      {/* Identité */}
      <div>
        <Label>Label</Label>
        <Input
          value={fields.label}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder='Label'
        />
      </div>
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <Label>Prénom</Label>
          <Input value={fields.prenom} onChange={(e) => handleChange('prenom', e.target.value)} />
        </div>
        <div>
          <Label>Nom</Label>
          <Input value={fields.nom} onChange={(e) => handleChange('nom', e.target.value)} />
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <Label>Sexe</Label>
          <Input
            value={fields.sexe}
            onChange={(e) => handleChange('sexe', e.target.value)}
            placeholder='F / M'
          />
        </div>
        <div>
          <Label>Âge</Label>
          <Input value={fields.age} onChange={(e) => handleChange('age', e.target.value)} />
        </div>
      </div>

      {/* Rôle & qualité */}
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <Label>Rôle</Label>
          <Input value={fields.role} onChange={(e) => handleChange('role', e.target.value)} />
        </div>
        <div>
          <Label>Qualité</Label>
          <Input value={fields.qualite} onChange={(e) => handleChange('qualite', e.target.value)} />
        </div>
      </div>

      {/* Profession & domicile */}
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <Label>Profession</Label>
          <Input
            value={fields.profession_brut}
            onChange={(e) => handleChange('profession_brut', e.target.value)}
          />
        </div>
        <div>
          <Label>Statut</Label>
          <Input
            value={fields.statut_brut}
            onChange={(e) => handleChange('statut_brut', e.target.value)}
          />
        </div>
        <div>
          <Label>Fonction</Label>
          <Input
            value={fields.fonction}
            onChange={(e) => handleChange('fonction', e.target.value)}
          />
        </div>
        <div>
          <Label>Domicile</Label>
          <Input
            value={fields.domicile}
            onChange={(e) => handleChange('domicile', e.target.value)}
          />
        </div>
      </div>

      {/* Lien */}
      <div>
        <Label>Lien</Label>
        <Input
          value={fields.lien}
          onChange={(e) => handleChange('lien', e.target.value)}
          placeholder='Ex : épouse de...'
        />
      </div>

      <div className='space-y-4'>
        <div className='flex flex-col gap-2'>
          <Label>Vivant</Label>
          <ToggleGroup
            type='single'
            value={
              fields.est_vivant === true
                ? 'vivant'
                : fields.est_vivant === false
                  ? 'decede'
                  : undefined
            }
            onValueChange={(val) => {
              if (val === 'vivant') handleChange('est_vivant', true);
              else if (val === 'decede') handleChange('est_vivant', false);
              else handleChange('est_vivant', null);
            }}
          >
            <ToggleGroupItem value='vivant'>Vivant</ToggleGroupItem>
            <ToggleGroupItem value='decede'>Décédé</ToggleGroupItem>
            <ToggleGroupItem value=''>N/R</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className='flex flex-col gap-2'>
          <Label>Présent</Label>
          <ToggleGroup
            type='single'
            value={
              fields.est_present === true
                ? 'présent'
                : fields.est_present === false
                  ? 'absent'
                  : undefined
            }
            onValueChange={(val) => {
              if (val === 'présent') handleChange('est_present', true);
              else if (val === 'absent') handleChange('est_present', false);
              else handleChange('est_present', null);
            }}
          >
            <ToggleGroupItem value='présent'>Présent</ToggleGroupItem>
            <ToggleGroupItem value='absent'>Absent</ToggleGroupItem>
            <ToggleGroupItem value=''>N/R</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className='flex flex-col gap-2'>
          <Label>A signé</Label>
          <ToggleGroup
            type='single'
            value={
              fields.a_signe === true
                ? 'a_signe'
                : fields.a_signe === false
                  ? 'pas_signe'
                  : undefined
            }
            onValueChange={(val) => {
              if (val === 'a_signe') handleChange('a_signe', true);
              else if (val === 'pas_signe') handleChange('a_signe', false);
              else handleChange('a_signe', null);
            }}
          >
            <ToggleGroupItem value='a_signe'>A signé</ToggleGroupItem>
            <ToggleGroupItem value='pas_signe'>N'a pas signé</ToggleGroupItem>
            <ToggleGroupItem value=''>N/R</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Observations */}
      <div>
        <Label>Observations</Label>
        <Textarea
          value={fields.note}
          onChange={(e) => handleChange('note', e.target.value)}
          rows={4}
          placeholder='Remarques, contexte, informations complémentaires...'
        />
      </div>
    </div>
  );
}
