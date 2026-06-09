import { Agentation } from 'agentation'
import { ToastContainer } from 'react-toastify'

import AppRoutes from './hooks/routes/PageRoute'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  return (
    <div className="min-h-screen">
      <AppRoutes />
      <ToastContainer position='top-right' autoClose={4000} newestOnTop closeOnClick pauseOnFocusLoss={false} />
      {import.meta.env.DEV && <Agentation endpoint="http://localhost:4747" />}
    </div>
  )
}

export default App
