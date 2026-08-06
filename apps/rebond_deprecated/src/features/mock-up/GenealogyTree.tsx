// GenealogyTree.tsx
import React from 'react';

// Types
export type Person = {
  id: string;
  name: string;
  title?: string;
  fatherId?: string;
  motherId?: string;
};

// Sample Data
const people: Person[] = [
  // Grands-parents
  { id: 'gp1', name: 'Albert Dupont', title: 'Grand-père paternel' },
  { id: 'gm1', name: 'Suzanne Martin', title: 'Grand-mère paternelle' },
  { id: 'gp2', name: 'Henri Curie', title: 'Grand-père maternel' },
  { id: 'gm2', name: 'Louise Moreau', title: 'Grand-mère maternelle' },

  // Parents et oncles/tantes
  { id: '1', name: 'Jean Dupont', title: 'Père', fatherId: 'gp1', motherId: 'gm1' },
  { id: '4', name: 'Claire Dupont', title: 'Tante', fatherId: 'gp1', motherId: 'gm1' },
  { id: '2', name: 'Marie Curie', title: 'Mère', fatherId: 'gp2', motherId: 'gm2' },
  { id: '5', name: 'Lucien Curie', title: 'Oncle', fatherId: 'gp2', motherId: 'gm2' },

  // Fratrie
  { id: '3', name: 'Luc Dupont', title: 'Moi', fatherId: '1', motherId: '2' },
  { id: '6', name: 'Émilie Dupont', title: 'Sœur', fatherId: '1', motherId: '2' },
  { id: '7', name: 'Paul Dupont', title: 'Frère', fatherId: '1', motherId: '2' },
];

// Components
function PersonCard({ person }: { person: Person }) {
  return (
    <div className="bg-white rounded-xl shadow p-3 w-40 text-center border">
      <div className="font-semibold mt-2 text-sm">{person.name}</div>
      <div className="text-xs text-gray-500">{person.title}</div>
    </div>
  );
}

function CoupleGroup({ father, mother, children }: { father: Person; mother: Person; children: Person[] }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        <PersonCard person={father} />
        <div className="h-0.5 bg-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 w-full z-0"></div>
        <PersonCard person={mother} />
      </div>
      <div className="h-4 w-0.5 bg-gray-400"></div>
      <div className="flex gap-4 mt-2">
        {children.map((child) => (
          <PersonCard key={child.id} person={child} />
        ))}
      </div>
    </div>
  );
}

function GenealogyTree() {
  const findPerson = (id: string | undefined) => people.find((p) => p.id === id);

  const couples = [
    { fatherId: 'gp1', motherId: 'gm1' },
    { fatherId: 'gp2', motherId: 'gm2' },
    { fatherId: '1', motherId: '2' },
  ];

  return (
    <div className="flex flex-col items-center gap-16 mt-10">
      {couples.map(({ fatherId, motherId }) => {
        const father = findPerson(fatherId);
        const mother = findPerson(motherId);
        if (!father || !mother) return null;

        const children = people.filter(
          (p) => p.fatherId === father.id && p.motherId === mother.id
        );

        return (
          <CoupleGroup
            key={father.id + '-' + mother.id}
            father={father}
            mother={mother}
            children={children}
          />
        );
      })}
    </div>
  );
}

export default GenealogyTree;
