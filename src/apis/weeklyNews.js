import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../../firebase.js'

const requests = new Map()

// Share a single attempt across tab remounts. A page reload allows retry after deployment.
export const prepareWeeklyNews = (date) => {
  if (!requests.has(date)) {
    const callable = httpsCallable(getFunctions(app, 'asia-northeast3'), 'prepareWeeklyNews')
    requests.set(date, callable({ date }).then(({ data }) => data))
  }
  return requests.get(date)
}
