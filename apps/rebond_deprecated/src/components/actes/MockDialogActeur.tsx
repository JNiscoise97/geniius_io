import React from "react";

export default function DialogDemo() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="w-[900px] h-[650px] rounded-md shadow-xl overflow-hidden flex flex-col bg-gray-50">
        {/* HEADER */}
        <div className="px-6 py-4 border-b bg-white flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Éditer l’acteur
          </h2>
          <button className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden">
          {/* Colonne gauche */}
          <div className="w-2/3 p-6 space-y-6 overflow-y-auto">
            {/* Section identité */}
            <section className="bg-white rounded-md shadow-sm overflow-hidden">
              <header className="px-4 py-2 bg-indigo-50 text-indigo-700 font-medium">
                Identité
              </header>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Nom
                  </label>
                  <input
                    type="text"
                    className="w-full mt-1 rounded-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nom..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Prénom
                  </label>
                  <input
                    type="text"
                    className="w-full mt-1 rounded-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Prénom..."
                  />
                </div>
              </div>
            </section>

            {/* Section rôle */}
            <section className="bg-white rounded-md shadow-sm overflow-hidden">
              <header className="px-4 py-2 bg-indigo-50 text-indigo-700 font-medium">
                Rôle & qualité
              </header>
              <div className="p-4 space-y-3">
                <select className="w-full rounded-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
                  <option>Témoin</option>
                  <option>Déclarant</option>
                  <option>Époux</option>
                </select>
                <input
                  type="text"
                  placeholder="Qualité (ex. cultivateur)"
                  className="w-full rounded-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </section>

            {/* Section infos complémentaires */}
            <section className="bg-white rounded-md shadow-sm overflow-hidden">
              <header className="px-4 py-2 bg-indigo-50 text-indigo-700 font-medium">
                Informations complémentaires
              </header>
              <div className="p-4 grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Âge"
                  className="w-full rounded-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Domicile"
                  className="w-full rounded-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </section>
          </div>

          {/* Colonne droite */}
          <div className="w-1/3 border-l bg-white p-6 overflow-y-auto space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Suggestions
            </h3>
            <div className="bg-indigo-50 rounded-sm p-3 text-sm text-indigo-800">
              Aucun doublon trouvé
            </div>

            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mt-6">
              Comparaison
            </h3>
            <div className="bg-gray-50 rounded-sm p-3 text-sm text-gray-600">
              Sélectionnez un acteur pour comparer
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-gray-100 border-t flex justify-end space-x-3">
          <button className="px-4 py-2 rounded-sm bg-white text-gray-700 border hover:bg-gray-50">
            Annuler
          </button>
          <button className="px-4 py-2 rounded-sm bg-indigo-600 text-white hover:bg-indigo-700">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
