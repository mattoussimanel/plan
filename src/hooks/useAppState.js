import { useEffect, useReducer, useRef } from 'react'
import { reducer } from '../state/reducer.js'
import { loadState, saveState } from '../lib/storage.js'

/** État global persistant (localStorage) + thème appliqué sur <html> */
export function useAppState() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const ref = useRef(state)
  ref.current = state
  useEffect(() => { saveState(state) }, [state])
  useEffect(() => { document.documentElement.dataset.theme = state.theme }, [state.theme])
  return [state, dispatch, ref]
}
