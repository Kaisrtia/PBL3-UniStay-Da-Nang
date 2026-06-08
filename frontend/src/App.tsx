import { Agentation } from 'agentation'

import AppRoutes from './hooks/routes/PageRoute'

function App() {
  return (
    <div className="min-h-screen">
      <AppRoutes />
      {import.meta.env.DEV && <Agentation endpoint="http://localhost:4747" />}
    </div>
  )
}

export default App
