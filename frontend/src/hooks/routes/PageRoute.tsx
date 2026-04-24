import { Routes, Route } from 'react-router-dom'

import {
  CreatePostPage,
  HomePage,
  LandingPage,
  LoginPage,
  PostDetailPage,
  RegisterPage,
  SearchResultsPage
} from '@/pages/index.tsx'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<LandingPage />}></Route>
      <Route path='/landing' element={<LandingPage />}></Route>
      <Route path='/login' element={<LoginPage />}></Route>
      <Route path='/home' element={<HomePage />}></Route>
      <Route path='/posts/create' element={<CreatePostPage />}></Route>
      <Route path='/posts/search' element={<SearchResultsPage />}></Route>
      <Route path='/posts/:postId' element={<PostDetailPage />}></Route>
      <Route path='/register' element={<RegisterPage />} />
    </Routes>
  )
}

export default AppRoutes
