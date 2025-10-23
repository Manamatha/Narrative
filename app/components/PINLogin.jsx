'use client'
import { useState } from 'react'
import styles from './PINLogin.module.css'

export default function PINLogin({ onLoginSuccess }) {
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newPin, setNewPin] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          pin: pin.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la connexion')
        setIsLoading(false)
        return
      }

      // Stocker le token en localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token)
      }

      // Notifier le parent que la connexion a réussi
      onLoginSuccess()
    } catch (err) {
      setError(`Erreur: ${err.message}`)
      setIsLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la création')
        setIsLoading(false)
        return
      }

      // Stocker le token en localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token)
      }

      // Afficher le PIN à l'utilisateur
      setNewPin(data.pin)

      // Notifier le parent que la connexion a réussi
      onLoginSuccess()
    } catch (err) {
      setError(`Erreur: ${err.message}`)
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>🎭 JDR-IA Narrative</h1>
        <p className={styles.subtitle}>Connectez-vous ou créez un compte</p>

        {newPin && (
          <div className={styles.successBox}>
            <h2>✨ Nouveau compte créé!</h2>
            <p>Votre PIN: <strong className={styles.pin}>{newPin}</strong></p>
            <p className={styles.hint}>Mémorisez ce PIN pour vous connecter sur tous vos appareils</p>
            <button
              onClick={() => {
                setNewPin('')
                setPin('')
              }}
              className={styles.button}
            >
              Continuer
            </button>
          </div>
        )}

        {!newPin && !showCreate && (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="pin">Entrez votre PIN (4 chiffres)</label>
              <input
                id="pin"
                type="text"
                maxLength="4"
                placeholder="0000"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                disabled={isLoading}
                className={styles.input}
                autoFocus
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button
              type="submit"
              disabled={pin.length !== 4 || isLoading}
              className={styles.button}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>

            <div className={styles.divider}>OU</div>

            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className={`${styles.button} ${styles.secondary}`}
            >
              Créer un nouveau compte
            </button>
          </form>
        )}

        {!newPin && showCreate && (
          <div className={styles.createBox}>
            <p>Un nouveau PIN sera généré pour vous.</p>
            <p className={styles.hint}>Ce PIN vous permettra de jouer sur tous vos appareils.</p>
            {error && <div className={styles.error}>{error}</div>}

            <button
              onClick={handleCreate}
              disabled={isLoading}
              className={styles.button}
            >
              {isLoading ? 'Création...' : 'Générer mon PIN'}
            </button>

            <button
              onClick={() => {
                setShowCreate(false)
                setError('')
              }}
              className={`${styles.button} ${styles.secondary}`}
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  )
}