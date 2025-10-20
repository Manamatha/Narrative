'use client'
import { useState, useEffect } from 'react'
import { getMemoryManager } from '@/app/utils/memoryManager'

export default function MemoryManager({ isOpen, onClose }) {
  const [campaign, setCampaign] = useState(null)
  const [activeTab, setActiveTab] = useState('chapitres')
  const [newTag, setNewTag] = useState('')
  const [memoryEnabled, setMemoryEnabled] = useState(true)
  const [availableTags, setAvailableTags] = useState([])

// Charger les tags disponibles de la session
useEffect(() => {
  if (isOpen && campaign) {
    const memoryManager = getMemoryManager()
    const tags = memoryManager.getAvailableTags()
    setAvailableTags(tags)
  }
}, [isOpen, campaign])

const removeAvailableTag = (tagToRemove) => {
  const memoryManager = getMemoryManager();
  const newTags = availableTags.filter(tag => tag !== tagToRemove);
  setAvailableTags(newTags);
  memoryManager.setAvailableTags(newTags);
}

const addNewAvailableTag = (newTag) => {
  if (newTag.trim() && !availableTags.includes(newTag.trim())) {
    const memoryManager = getMemoryManager();
    const newTags = [...availableTags, newTag.trim()];
    setAvailableTags(newTags);
    memoryManager.setAvailableTags(newTags);
  }
}

const resetAvailableTags = () => {
  const defaultTags = [
    'forêt', 'ville', 'donjon', 'montagne', 'mer', 'desert',
    'combat', 'enigme', 'social', 'exploration', 'commerce', 
    'magie', 'religion', 'politique', 'familial', 'sombre',
    'tragédie', 'victoire', 'trahison', 'alliance', 'révélation'
  ];
  setAvailableTags(defaultTags);
  const memoryManager = getMemoryManager();
  memoryManager.setAvailableTags(defaultTags);
}

  useEffect(() => {
    if (isOpen) {
      loadCampaign()
    }
  }, [isOpen])

  const loadCampaign = () => {
    const memoryManager = getMemoryManager()
    const currentCampaign = memoryManager.getCampaign()
    if (currentCampaign) {
      setCampaign(currentCampaign)
      setMemoryEnabled(currentCampaign.memory_enabled !== false)
    }
  }

  const saveCampaign = (updatedCampaign) => {
    const memoryManager = getMemoryManager()
    memoryManager.updateCampaign(updatedCampaign)
    setCampaign(updatedCampaign)
  }

  const toggleMemorySystem = () => {
    const memoryManager = getMemoryManager()
    const currentCampaign = memoryManager.getCampaign()
    if (currentCampaign) {
      const updated = { ...currentCampaign }
      updated.memory_enabled = !memoryEnabled
      memoryManager.updateCampaign(updated)
      setMemoryEnabled(!memoryEnabled)
    }
  }

 // GESTION DES TAGS GLOBAUX - VERSION FONCTIONNELLE
const addGlobalTag = (tag) => {
  console.log('➕ Ajout du tag global:', tag)
  const memoryManager = getMemoryManager()
  const currentCampaign = memoryManager.getCampaign()
  
  if (currentCampaign && tag.trim() && !currentCampaign.tags_globaux.includes(tag.trim())) {
    // Ajout MANUEL
    currentCampaign.tags_globaux.push(tag.trim())
    
    // Sauvegarde FORCÉE
    memoryManager.updateCampaign(currentCampaign)
    memoryManager.saveCampaign()
    
    // Rechargement
    setTimeout(() => {
      loadCampaign()
      console.log('✅ Tag ajouté avec succès')
    }, 100)
  }
}

const removeGlobalTag = (tag) => {
  console.log('🎯 FONCTION removeGlobalTag APPELLÉE')
  console.log('🗑️ Suppression du tag global:', tag)
  const memoryManager = getMemoryManager()
  const currentCampaign = memoryManager.getCampaign()
  
  if (currentCampaign) {
    // Suppression MANUELLE
    currentCampaign.tags_globaux = currentCampaign.tags_globaux.filter(t => t !== tag)
    
    // Sauvegarde FORCÉE
    memoryManager.updateCampaign(currentCampaign)
    memoryManager.saveCampaign()
    
    // Rechargement
    setTimeout(() => {
      loadCampaign()
      console.log('✅ Tag supprimé avec succès')
    }, 100)
  }
}


  // META
  const updateMeta = (field, value) => {
    const memoryManager = getMemoryManager()
    memoryManager.updateMeta(field, value)
    loadCampaign()
  }

  // CHAPITRES
  const addChapitre = () => {
    const memoryManager = getMemoryManager()
    memoryManager.addChapitre()
    loadCampaign()
  }

  const updateChapitre = (id, field, value) => {
    const memoryManager = getMemoryManager()
    memoryManager.updateChapitre(id, field, value)
    loadCampaign()
  }

  const addTagToChapitre = (chapitreId, tag) => {
    const memoryManager = getMemoryManager()
    memoryManager.addTagToChapitre(chapitreId, tag)
    loadCampaign()
  }

  const removeTagFromChapitre = (chapitreId, tag) => {
    const memoryManager = getMemoryManager()
    memoryManager.removeTagFromChapitre(chapitreId, tag)
    loadCampaign()
  }

  const deleteChapitre = (id) => {
    const memoryManager = getMemoryManager()
    memoryManager.deleteChapitre(id)
    loadCampaign()
  }

  // PNJ
  const addPNJ = () => {
    const memoryManager = getMemoryManager()
    memoryManager.addPNJ()
    loadCampaign()
  }

  const updatePNJ = (index, field, value) => {
    const memoryManager = getMemoryManager()
    memoryManager.updatePNJ(index, field, value)
    loadCampaign()
  }

  const addTagToPNJ = (pnjIndex, tag) => {
    const memoryManager = getMemoryManager()
    memoryManager.addTagToPNJ(pnjIndex, tag)
    loadCampaign()
  }

  const removeTagFromPNJ = (pnjIndex, tag) => {
    const memoryManager = getMemoryManager()
    memoryManager.removeTagFromPNJ(pnjIndex, tag)
    loadCampaign()
  }

  const deletePNJ = (index) => {
    const memoryManager = getMemoryManager()
    memoryManager.deletePNJ(index)
    loadCampaign()
  }

  // LIEUX
  const addLieu = () => {
    const memoryManager = getMemoryManager()
    memoryManager.addLieu()
    loadCampaign()
  }

  const updateLieu = (index, field, value) => {
    const memoryManager = getMemoryManager()
    memoryManager.updateLieu(index, field, value)
    loadCampaign()
  }

  const addTagToLieu = (lieuIndex, tag) => {
    const memoryManager = getMemoryManager()
    memoryManager.addTagToLieu(lieuIndex, tag)
    loadCampaign()
  }

  const removeTagFromLieu = (lieuIndex, tag) => {
    const memoryManager = getMemoryManager()
    memoryManager.removeTagFromLieu(lieuIndex, tag)
    loadCampaign()
  }

  const deleteLieu = (index) => {
    const memoryManager = getMemoryManager()
    memoryManager.deleteLieu(index)
    loadCampaign()
  }

  // ÉVÉNEMENTS
  const addEvenement = () => {
    const memoryManager = getMemoryManager()
    memoryManager.addEvenement()
    loadCampaign()
  }

  const updateEvenement = (index, field, value) => {
    const memoryManager = getMemoryManager()
    memoryManager.updateEvenement(index, field, value)
    loadCampaign()
  }

  const addTagToEvenement = (eventIndex, tag) => {
    const memoryManager = getMemoryManager()
    memoryManager.addTagToEvenement(eventIndex, tag)
    loadCampaign()
  }

  const removeTagFromEvenement = (eventIndex, tag) => {
    const memoryManager = getMemoryManager()
    memoryManager.removeTagFromEvenement(eventIndex, tag)
    loadCampaign()
  }

  const deleteEvenement = (index) => {
    const memoryManager = getMemoryManager()
    memoryManager.deleteEvenement(index)
    loadCampaign()
  }

  // Fonctions utilitaires pour les émotions
  const decoderEmotions = (emotionCode) => {
    const memoryManager = getMemoryManager()
    return memoryManager.decoderEmotions(emotionCode)
  }

  const getEmotionDescription = (valeur) => {
    const memoryManager = getMemoryManager()
    return memoryManager.getEmotionDescription(valeur)
  }

  const getEmotionColor = (valeur) => {
    const memoryManager = getMemoryManager()
    return memoryManager.getEmotionColor(valeur)
  }

  const getVitesseDescription = (valeur) => {
    const memoryManager = getMemoryManager()
    return memoryManager.getVitesseDescription(valeur)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="bg-gray-900 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">🧠 Gestionnaire de Mémoire</h2>
          <div className="flex gap-2">
            <button 
              onClick={toggleMemorySystem}
              className={`px-4 py-2 rounded ${
                memoryEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              Mémoire: {memoryEnabled ? 'ON' : 'OFF'}
            </button>
            <button onClick={onClose} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
              Fermer
            </button>
          </div>
        </div>

        <div className="flex h-[70vh]">
          {/* Navigation */}
          <div className="w-48 bg-gray-700 p-4">
            <nav className="space-y-2">
              <button onClick={() => setActiveTab('tags')} className={`w-full text-left p-2 rounded ${activeTab === 'tags' ? 'bg-purple-600' : 'bg-gray-600'}`}>
                🏷️ Tags Globaux
              </button>
              <button onClick={() => setActiveTab('meta')} className={`w-full text-left p-2 rounded ${activeTab === 'meta' ? 'bg-purple-600' : 'bg-gray-600'}`}>
                📋 Meta
              </button>
              <button onClick={() => setActiveTab('chapitres')} className={`w-full text-left p-2 rounded ${activeTab === 'chapitres' ? 'bg-purple-600' : 'bg-gray-600'}`}>
                📁 Chapitres ({campaign?.chapitres.length || 0})
              </button>
              <button onClick={() => setActiveTab('pnj')} className={`w-full text-left p-2 rounded ${activeTab === 'pnj' ? 'bg-purple-600' : 'bg-gray-600'}`}>
                👥 PNJ ({campaign?.pnj_importants.length || 0})
              </button>
              <button onClick={() => setActiveTab('lieux')} className={`w-full text-left p-2 rounded ${activeTab === 'lieux' ? 'bg-purple-600' : 'bg-gray-600'}`}>
                🏰 Lieux ({campaign?.lieux_importants.length || 0})
              </button>
              <button onClick={() => setActiveTab('evenements')} className={`w-full text-left p-2 rounded ${activeTab === 'evenements' ? 'bg-purple-600' : 'bg-gray-600'}`}>
                ⚡ Événements ({campaign?.evenements_cles.length || 0})
              </button>
            </nav>
          </div>

          {/* Contenu */}
          <div className="flex-1 overflow-y-auto p-4">
            {!campaign ? <div>Chargement...</div> : (
              <>
                {/* TAGS GLOBAUX */}
                {activeTab === 'tags' && (
  <div className="space-y-6">
    <h3 className="text-lg font-bold">🏷️ Tags Globaux</h3>
    
    {/* Section 1: Tags actifs de la campagne */}
    {/* Section 1: Tags actifs de la campagne - VERSION FONCTIONNELLE */}
<div className="bg-gray-700 p-4 rounded">
  <h4 className="font-bold mb-3 text-purple-300">Tags actifs de la campagne :</h4>
  {campaign.tags_globaux.length === 0 ? (
    <p className="text-gray-400 text-sm italic">Aucun tag actif - ajoutez des tags pour organiser votre campagne</p>
  ) : (
    <div className="flex flex-wrap gap-2">
      {campaign.tags_globaux.map(tag => (
        <span key={tag} className="bg-purple-600 px-3 py-1 rounded-full text-sm flex items-center gap-1">
          {tag}
          <button 
  onClick={() => removeGlobalTag(tag)}
  className="text-xs bg-purple-700 hover:bg-red-600 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
  title="Supprimer ce tag"
>
  ×
</button>
        </span>
      ))}
    </div>
  )}
</div>

    {/* Section 2: Ajouter un nouveau tag */}
    <div className="bg-gray-700 p-4 rounded">
      <h4 className="font-bold mb-3 text-green-300">Ajouter un nouveau tag :</h4>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={newTag} 
          onChange={(e) => setNewTag(e.target.value)} 
          placeholder="Tapez un nouveau tag..." 
          className="flex-1 p-2 bg-gray-600 rounded border border-gray-500 focus:border-green-500 focus:outline-none" 
          onKeyPress={(e) => {
            if (e.key === 'Enter' && newTag.trim()) {
              addGlobalTag(newTag.trim())
              setNewTag('')
            }
          }}
        />
        <button 
          onClick={() => {
            if (newTag.trim()) {
              addGlobalTag(newTag.trim())
              setNewTag('')
            }
          }} 
          disabled={!newTag.trim()}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded transition-colors"
        >
          + Ajouter
        </button>
      </div>
    </div>

    {/* Section 3: Tags suggérés */}
    <div className="bg-gray-700 p-4 rounded">
      <h4 className="font-bold mb-3 text-blue-300">Tags suggérés :</h4>
      <div className="flex flex-wrap gap-2">
        {availableTags
          .filter(tag => !campaign.tags_globaux.includes(tag))
          .map(tag => (
            <button 
              key={tag} 
              onClick={() => {
                addGlobalTag(tag)
                // Recharger pour voir le tag ajouté
                setTimeout(() => loadCampaign(), 100)
              }}
              className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm transition-colors"
            >
              {tag}
            </button>
          ))
        }
        {availableTags.filter(tag => !campaign.tags_globaux.includes(tag)).length === 0 && (
          <p className="text-gray-400 text-sm italic">Tous les tags suggérés sont déjà actifs</p>
        )}
      </div>
    </div>

    {/* Section 4: Gestion des tags disponibles */}
    {/* Section 4: Gérer les tags disponibles - MAINTENANT SUPPRIMABLES */}
<div className="bg-gray-700 p-4 rounded">
  <div className="flex justify-between items-center mb-3">
    <h4 className="font-bold text-orange-300">Gérer les tags disponibles :</h4>
    <button 
      onClick={resetAvailableTags}
      className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm"
    >
      Réinitialiser
    </button>
  </div>
  
  {/* Ajouter un nouveau tag disponible */}
  <div className="flex gap-2 mb-3">
    <input 
      type="text" 
      placeholder="Nouveau tag disponible..." 
      onKeyPress={(e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
          addNewAvailableTag(e.target.value)
          e.target.value = ''
        }
      }}
      className="flex-1 p-2 bg-gray-600 rounded text-sm"
    />
    <button 
      onClick={(e) => {
        const input = e.target.previousSibling
        if (input.value.trim()) {
          addNewAvailableTag(input.value)
          input.value = ''
        }
      }}
      className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
    >
      +
    </button>
  </div>
  
  {/* Liste des tags disponibles avec suppression */}
  <div className="flex flex-wrap gap-2">
    {availableTags.map(tag => (
      <span 
        key={tag} 
        className="bg-orange-600 px-3 py-1 rounded text-sm flex items-center gap-1"
      >
        {tag}
        <button 
          onClick={() => removeAvailableTag(tag)}
          className="text-xs bg-orange-700 hover:bg-red-600 rounded-full w-4 h-4 flex items-center justify-center"
          title="Supprimer de la liste des tags disponibles"
        >
          ×
        </button>
      </span>
    ))}
  </div>
  
  {availableTags.length === 0 && (
    <p className="text-gray-400 text-sm italic mt-2">Aucun tag disponible - ajoutez-en !</p>
  )}
</div>
  </div>
)}

                {/* META */}
                {activeTab === 'meta' && (
  <div className="space-y-4">
    <h3 className="text-lg font-bold">📋 Informations Générales</h3>
    
    {/* TITRE */}
    <div>
      <label className="block text-sm font-medium mb-1">Titre</label>
      <input 
        type="text" 
        value={campaign.meta.titre} 
        onChange={(e) => {
          const memoryManager = getMemoryManager();
          const updatedCampaign = JSON.parse(JSON.stringify(campaign));
          updatedCampaign.meta.titre = e.target.value;
          memoryManager.updateCampaign(updatedCampaign);
          loadCampaign();
        }} 
        className="w-full p-2 bg-gray-700 rounded" 
      />
    </div>
    
    {/* RÉSUMÉ */}
    <div>
      <label className="block text-sm font-medium mb-1">Résumé global</label>
      <textarea 
        value={campaign.meta.resume_global} 
        onChange={(e) => {
          const memoryManager = getMemoryManager();
          const updatedCampaign = JSON.parse(JSON.stringify(campaign));
          updatedCampaign.meta.resume_global = e.target.value;
          memoryManager.updateCampaign(updatedCampaign);
          loadCampaign();
        }} 
        rows="4" 
        className="w-full p-2 bg-gray-700 rounded" 
        placeholder="Résumé général de l'aventure..." 
      />
    </div>
    
    {/* STYLE - gardez votre code actuel qui marche */}
    <div>
      <label className="block text-sm font-medium mb-1">🎭 Style de Narration</label>
      <textarea 
        value={campaign.style_narration || ""} 
        onChange={(e) => {
          const memoryManager = getMemoryManager();
          const updatedCampaign = JSON.parse(JSON.stringify(campaign));
          updatedCampaign.style_narration = e.target.value;
          memoryManager.updateCampaign(updatedCampaign);
          loadCampaign();
        }} 
        rows="4" 
        className="w-full p-2 bg-gray-700 rounded text-sm"  
        placeholder="Ex: Style sombre et descriptif. Utilise des métaphores. Crée de la tension." 
      />
      <p className="text-xs text-gray-400 mt-1">Ces consignes de style sont lues par l'IA à chaque message</p>
    </div>
    
    <div className="text-sm text-gray-400">
      <p>Créé le: {new Date(campaign.meta.date_creation).toLocaleDateString()}</p>
      <p>Dernière sauvegarde: {new Date(campaign.meta.date_derniere_sauvegarde).toLocaleString()}</p>
    </div>
  </div>
)}
                {/* CHAPITRES */}
                {activeTab === 'chapitres' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold">📁 Chapitres</h3>
                      <button onClick={addChapitre} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded">+ Ajouter</button>
                    </div>
                    {campaign.chapitres.length === 0 ? <p className="text-gray-400 text-center py-8">Aucun chapitre</p> : (
                      <div className="space-y-4">
                        {campaign.chapitres.map((chapitre) => (
                          <div key={chapitre.id} className="bg-gray-700 p-4 rounded">
                            <div className="flex justify-between items-start mb-3">
                              <input type="text" value={chapitre.titre} onChange={(e) => updateChapitre(chapitre.id, 'titre', e.target.value)} className="text-lg font-bold bg-transparent border-b border-gray-600 focus:border-purple-500 outline-none" />
                              <div className="flex gap-2">
                                <select value={chapitre.priorite} onChange={(e) => updateChapitre(chapitre.id, 'priorite', parseInt(e.target.value))} className="bg-gray-600 rounded px-2">
                                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>Priorité: {n}</option>)}
                                </select>
                                <button onClick={() => deleteChapitre(chapitre.id)} className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm">Supprimer</button>
                              </div>
                            </div>
                            <textarea value={chapitre.resume} onChange={(e) => updateChapitre(chapitre.id, 'resume', e.target.value)} rows="3" className="w-full p-2 bg-gray-600 rounded text-sm mb-3" placeholder="Résumé du chapitre..." />
                            <div className="mb-2">
                              <label className="text-sm font-medium mb-1 block">Tags :</label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {chapitre.tags.map(tag => (
                                  <span key={tag} className="bg-blue-600 px-2 py-1 rounded text-xs flex items-center gap-1">
                                    {tag}
                                    <button onClick={() => removeTagFromChapitre(chapitre.id, tag)} className="text-xs">×</button>
                                  </span>
                                ))}
                              </div>
                              <select onChange={(e) => { if (e.target.value) { addTagToChapitre(chapitre.id, e.target.value); e.target.value = '' } }} className="bg-gray-600 rounded text-sm px-2">
                                <option value="">Ajouter un tag...</option>
                                {availableTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PNJ AVEC SYSTÈME ÉMOTIONNEL COMPLET */}
                {activeTab === 'pnj' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold">👥 Personnages Importants</h3>
                      <button onClick={addPNJ} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded">+ Ajouter</button>
                    </div>
                    {campaign.pnj_importants.length === 0 ? <p className="text-gray-400 text-center py-8">Aucun PNJ</p> : (
                      <div className="space-y-4">
                        {campaign.pnj_importants.map((pnj, index) => {
                          const emotions = decoderEmotions(pnj.emotion)
                          
                          return (
                          <div key={index} className="bg-gray-700 p-4 rounded">
                            <div className="flex justify-between items-start mb-3">
                              <input type="text" value={pnj.nom} onChange={(e) => updatePNJ(index, 'nom', e.target.value)} className="text-lg font-bold bg-transparent border-b border-gray-600 focus:border-purple-500 outline-none" />
                              <div className="flex gap-2">
                                <select value={pnj.priorite} onChange={(e) => updatePNJ(index, 'priorite', parseInt(e.target.value))} className="bg-gray-600 rounded px-2">
                                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>Priorité: {n}</option>)}
                                </select>
                                <button onClick={() => deletePNJ(index)} className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm">Supprimer</button>
                              </div>
                            </div>
                            
                            <input type="text" value={pnj.role} onChange={(e) => updatePNJ(index, 'role', e.target.value)} placeholder="Rôle..." className="w-full p-2 bg-gray-600 rounded text-sm mb-3" />
                            <textarea value={pnj.description} onChange={(e) => updatePNJ(index, 'description', e.target.value)} rows="2" className="w-full p-2 bg-gray-600 rounded text-sm mb-3" placeholder="Description physique et personnalité..." />

                            {/* SECTION ÉMOTIONNELLE COMPLÈTE */}
                            <div className="mt-4 p-4 bg-gray-600 rounded">
                              <h4 className="text-md font-bold mb-3">🎭 Profil Émotionnel</h4>
                              
                              {/* Caractère */}
                              <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">Caractère:</label>
                                <input
                                  value={pnj.caractere || ""}
                                  onChange={(e) => updatePNJ(index, 'caractere', e.target.value)}
                                  placeholder="courageux, loyal, cynique, idéaliste..."
                                  className="w-full p-2 bg-gray-500 rounded text-sm"
                                />
                              </div>

                              {/* Vitesse d'évolution */}
                              <div className="mb-3">
                                <label className="block text-sm font-medium mb-2">
                                  Vitesse d'évolution: {pnj.vitesse_evolution || 1.0} ({getVitesseDescription(pnj.vitesse_evolution || 1.0)})
                                </label>
                                <input
                                  type="range"
                                  min="0.1"
                                  max="2.0"
                                  step="0.1"
                                  value={pnj.vitesse_evolution || 1.0}
                                  onChange={(e) => updatePNJ(index, 'vitesse_evolution', parseFloat(e.target.value))}
                                  className="w-full h-2 bg-gray-500 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                  <span>Très lent (0.1)</span>
                                  <span>Normal (1.0)</span>
                                  <span>Très rapide (2.0)</span>
                                </div>
                              </div>

                              {/* Émotions compactes */}
                              <div className="mb-3">
                                <label className="block text-sm font-medium mb-2">Émotions (format compact):</label>
                                <input
                                  type="text"
                                  value={pnj.emotion || "C50-A30-P50-H10-R50-J10"}
                                  onChange={(e) => updatePNJ(index, 'emotion', e.target.value)}
                                  className="w-full p-2 bg-gray-500 rounded text-sm font-mono"
                                  placeholder="C50-A30-P50-H10-R50-J10"
                                />
                                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                  {Object.entries(emotions).map(([emotion, valeur]) => (
                                    <div key={emotion} className="flex justify-between">
                                      <span className="capitalize">{emotion}:</span>
                                      <span className={`font-medium ${getEmotionColor(valeur)}`}>
                                        {valeur}% ({getEmotionDescription(valeur)})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  C=Confiance, A=Amour, P=Peur, H=Haine, R=Respect, J=Jalousie
                                </p>
                              </div>

                              {/* Valeurs, Peurs, Désirs */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Valeurs:</label>
                                  <input
                                    value={pnj.valeurs || ""}
                                    onChange={(e) => updatePNJ(index, 'valeurs', e.target.value)}
                                    className="w-full p-2 bg-gray-500 rounded text-sm"
                                    placeholder="honneur, liberté, famille..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Peurs:</label>
                                  <input
                                    value={pnj.peurs || ""}
                                    onChange={(e) => updatePNJ(index, 'peurs', e.target.value)}
                                    className="w-full p-2 bg-gray-500 rounded text-sm"
                                    placeholder="trahison, échec, solitude..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Désirs:</label>
                                  <input
                                    value={pnj.desirs || ""}
                                    onChange={(e) => updatePNJ(index, 'desirs', e.target.value)}
                                    className="w-full p-2 bg-gray-500 rounded text-sm"
                                    placeholder="pouvoir, amour, vengeance..."
                                  />
                                </div>
                              </div>

                              {/* Histoire des événements */}
                              <div>
                                <label className="block text-sm font-medium mb-1">Histoire:</label>
                                <textarea
                                  value={pnj.histoire || ""}
                                  onChange={(e) => updatePNJ(index, 'histoire', e.target.value)}
                                  rows="2"
                                  className="w-full p-2 bg-gray-500 rounded text-sm"
                                  placeholder="2024-01-15: sauvetage → C+30,A+25"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                  L'IA met à jour automatiquement lors d'événements importants
                                </p>
                              </div>
                            </div>

                            {/* Tags */}
                            <div>
                              <label className="text-sm font-medium mb-1 block">Tags :</label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {pnj.tags.map(tag => (
                                  <span key={tag} className="bg-green-600 px-2 py-1 rounded text-xs flex items-center gap-1">
                                    {tag}
                                    <button onClick={() => removeTagFromPNJ(index, tag)} className="text-xs">×</button>
                                  </span>
                                ))}
                              </div>
                              <select onChange={(e) => { if (e.target.value) { addTagToPNJ(index, e.target.value); e.target.value = '' } }} className="bg-gray-600 rounded text-sm px-2">
                                <option value="">Ajouter un tag...</option>
                                {availableTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                              </select>
                            </div>
                          </div>
                        )})}
                      </div>
                    )}
                  </div>
                )}

                {/* LIEUX */}
                {activeTab === 'lieux' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold">🏰 Lieux Importants</h3>
                      <button onClick={addLieu} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded">+ Ajouter</button>
                    </div>
                    {campaign.lieux_importants.length === 0 ? <p className="text-gray-400 text-center py-8">Aucun lieu</p> : (
                      <div className="space-y-4">
                        {campaign.lieux_importants.map((lieu, index) => (
                          <div key={index} className="bg-gray-700 p-4 rounded">
                            <div className="flex justify-between items-start mb-3">
                              <input type="text" value={lieu.nom} onChange={(e) => updateLieu(index, 'nom', e.target.value)} className="text-lg font-bold bg-transparent border-b border-gray-600 focus:border-purple-500 outline-none" />
                              <div className="flex gap-2">
                                <select value={lieu.priorite} onChange={(e) => updateLieu(index, 'priorite', parseInt(e.target.value))} className="bg-gray-600 rounded px-2">
                                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>Priorité: {n}</option>)}
                                </select>
                                <button onClick={() => deleteLieu(index)} className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm">Supprimer</button>
                              </div>
                            </div>
                            <textarea value={lieu.description} onChange={(e) => updateLieu(index, 'description', e.target.value)} rows="2" className="w-full p-2 bg-gray-600 rounded text-sm mb-3" placeholder="Description..." />
                            <div>
                              <label className="text-sm font-medium mb-1 block">Tags :</label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {lieu.tags.map(tag => (
                                  <span key={tag} className="bg-yellow-600 px-2 py-1 rounded text-xs flex items-center gap-1">
                                    {tag}
                                    <button onClick={() => removeTagFromLieu(index, tag)} className="text-xs">×</button>
                                  </span>
                                ))}
                              </div>
                              <select onChange={(e) => { if (e.target.value) { addTagToLieu(index, e.target.value); e.target.value = '' } }} className="bg-gray-600 rounded text-sm px-2">
                                <option value="">Ajouter un tag...</option>
                                {availableTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ÉVÉNEMENTS - SYSTÈME COMPLET */}
                {activeTab === 'evenements' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold">⚡ Événements Clés</h3>
                      <button onClick={addEvenement} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded">+ Ajouter</button>
                    </div>
                    {campaign.evenements_cles.length === 0 ? <p className="text-gray-400 text-center py-8">Aucun événement</p> : (
                      <div className="space-y-4">
                        {campaign.evenements_cles.map((evenement, index) => (
                          <div key={index} className="bg-gray-700 p-4 rounded">
                            <div className="flex justify-between items-start mb-3">
                              <input 
                                type="text" 
                                value={evenement.titre} 
                                onChange={(e) => updateEvenement(index, 'titre', e.target.value)} 
                                className="text-lg font-bold bg-transparent border-b border-gray-600 focus:border-purple-500 outline-none"
                                placeholder="Titre de l'événement"
                              />
                              <div className="flex gap-2">
                                <select value={evenement.priorite} onChange={(e) => updateEvenement(index, 'priorite', parseInt(e.target.value))} className="bg-gray-600 rounded px-2">
                                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>Priorité: {n}</option>)}
                                </select>
                                <button onClick={() => deleteEvenement(index)} className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm">Supprimer</button>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-400 mb-3">
                              {new Date(evenement.date).toLocaleDateString()}
                            </div>

                            <div className="mb-3">
                              <label className="block text-sm font-medium mb-1">Description:</label>
                              <textarea 
                                value={evenement.description} 
                                onChange={(e) => updateEvenement(index, 'description', e.target.value)} 
                                rows="3" 
                                className="w-full p-2 bg-gray-600 rounded text-sm" 
                                placeholder="Description détaillée de l'événement..." 
                              />
                            </div>

                            <div className="mb-3">
                              <label className="block text-sm font-medium mb-1">Conséquences:</label>
                              <textarea 
                                value={evenement.consequences || ""} 
                                onChange={(e) => updateEvenement(index, 'consequences', e.target.value)} 
                                rows="2" 
                                className="w-full p-2 bg-gray-600 rounded text-sm" 
                                placeholder="Conséquences sur l'histoire, les personnages..." 
                              />
                            </div>

                            <div className="mb-3">
                              <label className="text-sm font-medium mb-1 block">Tags :</label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {evenement.tags.map(tag => (
                                  <span key={tag} className="bg-orange-600 px-2 py-1 rounded text-xs flex items-center gap-1">
                                    {tag}
                                    <button onClick={() => removeTagFromEvenement(index, tag)} className="text-xs">×</button>
                                  </span>
                                ))}
                              </div>
                              <select onChange={(e) => { if (e.target.value) { addTagToEvenement(index, e.target.value); e.target.value = '' } }} className="bg-gray-600 rounded text-sm px-2">
                                <option value="">Ajouter un tag...</option>
                                {availableTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}