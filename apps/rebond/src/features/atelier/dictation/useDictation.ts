// useDictation.ts
// Dictée vocale en mode simple (batch) : enregistrement complet du micro,
// envoyé en UNE seule requête HTTP au service de transcription à l'arrêt —
// pas de segmentation ni de streaming. Repris de zéro après une version VAD
// + WebSocket streaming qui n'a jamais fonctionné de bout en bout en usage
// réel (plusieurs bugs distincts en cascade : assets onnxruntime-web bloqués
// par Vite, entrelacement de frames sur la connexion, fermeture prématurée).
// Cette version a beaucoup moins de pièces mobiles : un enregistrement, une
// requête, une réponse.
//
// Ne touche jamais l'éditeur Tiptap directement — la page (seule responsable
// des transactions ProseMirror) reçoit onTranscribed(text) et décide comment
// muter le document.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DictationServiceInfo, DictationStatus } from './dictation.types'

const SERVICE_URL = import.meta.env.VITE_DICTATION_SERVICE_URL as string | undefined

type UseDictationOptions = {
  onTranscribed: (text: string) => void
}

export function useDictation({ onTranscribed }: UseDictationOptions) {
  const [status, setStatus] = useState<DictationStatus>('idle')
  const [micLevel, setMicLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [serviceInfo, setServiceInfo] = useState<DictationServiceInfo | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const meterRafRef = useRef<number | null>(null)
  const lastRecordingRef = useRef<Blob | null>(null)
  // Figés au moment de start() (le contexte du document ne change pas en
  // cours de dictée) — réutilisés tels quels par retry().
  const promptRef = useRef<string | undefined>(undefined)
  // Liste brute des mêmes mots-clés que promptRef — utilisée côté service
  // pour une passe de correction post-transcription (voir correction.py),
  // en plus du biais initial_prompt qui, lui, ne garantit rien.
  const keywordsRef = useRef<string[] | undefined>(undefined)

  const onTranscribedRef = useRef(onTranscribed)
  useEffect(() => { onTranscribedRef.current = onTranscribed }, [onTranscribed])

  const stopMeter = useCallback(() => {
    if (meterRafRef.current) cancelAnimationFrame(meterRafRef.current)
    meterRafRef.current = null
    setMicLevel(0)
  }, [])

  const sendForTranscription = useCallback(async (blob: Blob) => {
    if (!SERVICE_URL) {
      setStatus('error')
      setError('Service de dictée non configuré (VITE_DICTATION_SERVICE_URL manquant)')
      return
    }
    setStatus('transcribing')
    setError(null)
    try {
      const form = new FormData()
      form.append('file', blob, 'recording.webm')
      if (promptRef.current) form.append('prompt', promptRef.current)
      if (keywordsRef.current && keywordsRef.current.length > 0) {
        form.append('keywords', JSON.stringify(keywordsRef.current))
      }
      const res = await fetch(`${SERVICE_URL}/transcribe`, { method: 'POST', body: form })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail ?? `Le service de dictée a répondu ${res.status}`)
      }
      const data = await res.json()
      setStatus('idle')
      onTranscribedRef.current(data.text ?? '')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : "Échec de la transcription")
    }
  }, [])

  // prompt : indice de contexte optionnel (noms propres attendus dans ce
  // document — commune, patronymes déjà connus) transmis à chaque requête
  // de transcription pour biaiser la reconnaissance. Voir dictationPrompt.ts.
  // keywords : les mêmes noms, mais en liste — pour la passe de correction
  // post-transcription (voir correction.py côté service).
  const start = useCallback(async (prompt?: string, keywords?: string[]) => {
    setError(null)
    promptRef.current = prompt
    keywordsRef.current = keywords

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    chunksRef.current = []
    const recorder = new MediaRecorder(stream)
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.start(1000)
    mediaRecorderRef.current = recorder

    // Jauge de niveau micro — preuve visuelle que le micro capte, indépendante
    // de la transcription (qui n'arrive qu'à la toute fin).
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)
    audioContextRef.current = audioContext
    const levels = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      analyser.getByteTimeDomainData(levels)
      let sum = 0
      for (let i = 0; i < levels.length; i++) { const v = (levels[i] - 128) / 128; sum += v * v }
      setMicLevel(Math.sqrt(sum / levels.length))
      meterRafRef.current = requestAnimationFrame(tick)
    }
    tick()

    fetch(`${SERVICE_URL ?? ''}/health`).then(r => r.json()).then(d => {
      setServiceInfo({ device: d.device, computeType: d.computeType, modelId: d.modelId })
    }).catch(() => {})

    setStatus('recording')
  }, [])

  // Arrête l'enregistrement et renvoie l'audio complet (pour le filet de
  // sécurité, uploadé par la page indépendamment du résultat de la
  // transcription) ; déclenche la transcription en tâche de fond sans
  // bloquer sur sa réponse.
  const stop = useCallback(async (): Promise<Blob | null> => {
    stopMeter()
    audioContextRef.current?.close().catch(() => {})
    audioContextRef.current = null

    const recorder = mediaRecorderRef.current
    const blob = await new Promise<Blob | null>(resolve => {
      if (!recorder || recorder.state === 'inactive') { resolve(null); return }
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: 'audio/webm' }))
      recorder.stop()
    })
    mediaRecorderRef.current = null

    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null

    if (blob && blob.size > 0) {
      lastRecordingRef.current = blob
      sendForTranscription(blob)
    } else {
      setStatus('idle')
    }

    return blob
  }, [stopMeter, sendForTranscription])

  const retry = useCallback(() => {
    if (lastRecordingRef.current) sendForTranscription(lastRecordingRef.current)
  }, [sendForTranscription])

  return { status, micLevel, error, serviceInfo, start, stop, retry }
}
