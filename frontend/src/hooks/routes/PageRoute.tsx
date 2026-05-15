import { Navigate, Route, Routes } from 'react-router-dom'

import {
  AdminOverviewPage,
  AdminPostsPage,
  AdminUsersPage,
  ContactRequestsPage,
  CreatePostPage,
  DemandPage,
  FavouritePostsPage,
  HomePage,
  LandingPage,
  LoginPage,
  MyPostsPage,
  PostDetailPage,
  ProfilePage,
  RegisterPage,
  SearchResultsPage,
  VerifyEmailPage
} from '@/pages/index.tsx'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<LandingPage />}></Route>
      <Route path='/landing' element={<LandingPage />}></Route>
      <Route path='/login' element={<LoginPage />}></Route>
      <Route path='/home' element={<HomePage />}></Route>
      <Route path='/post' element={<Navigate to='/posts/search' replace />} />
      <Route path='/posts' element={<Navigate to='/posts/search' replace />} />
      <Route path='/posts/create' element={<CreatePostPage />}></Route>
      <Route path='/posts/favourites' element={<FavouritePostsPage />}></Route>
      <Route path='/posts/me' element={<MyPostsPage />}></Route>
      <Route path='/contacts' element={<ContactRequestsPage />}></Route>
      <Route path='/posts/search' element={<SearchResultsPage />}></Route>
      <Route path='/posts/:postId' element={<PostDetailPage />}></Route>
      <Route path='/account/profile' element={<ProfilePage />}></Route>
      <Route path='/demands' element={<DemandPage />}></Route>
      <Route path='/admin' element={<Navigate to='/admin/overview' replace />} />
      <Route path='/admin/overview' element={<AdminOverviewPage />}></Route>
      <Route path='/admin/posts' element={<AdminPostsPage />}></Route>
      <Route path='/admin/users' element={<AdminUsersPage />}></Route>
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/verify-email' element={<VerifyEmailPage />} />
      <Route path='*' element={<Navigate to='/home' replace />} />
    </Routes>
  )
}

export default AppRoutes
