import { Routes, Route } from 'react-router-dom'

import { LoginPage, LandingPage, RegisterPage } from '@/pages/index.tsx'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<LoginPage />}></Route>
      <Route path='/login' element={<LoginPage />}></Route>
      <Route path='/home' element={<LandingPage />}></Route>
      <Route path='/register' element={<RegisterPage />} />
    </Routes>
  )
}

export default AppRoutes
