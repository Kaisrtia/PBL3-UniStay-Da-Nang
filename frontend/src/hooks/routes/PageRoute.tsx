import { Navigate, Route, Routes } from 'react-router-dom'

import {
  AdminOverviewPage,
  AdminReportsPage,
  AdminHostsPage,
  AdminPostsPage,
  AdminUsersPage,
  BlockedUsersPage,
  ChangePasswordPage,
  ContactRequestsPage,
  CreatePostPage,
  DemandPage,
  FavouritePostsPage,
  ForgotPasswordPage,
  HomePage,
  LandingPage,
  LoginPage,
  MyPostsPage,
  NearbyPostsPage,
  PostDetailPage,
  ProfilePage,
  RegisterPage,
  ResetPasswordPage,
  SearchResultsPage,
  VerifyEmailPage
} from '@/pages/index.tsx'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<LandingPage />}></Route>
      <Route path='/landing' element={<LandingPage />}></Route>
      <Route path='/login' element={<LoginPage />}></Route>
      <Route path='/forgot-password' element={<ForgotPasswordPage />}></Route>
      <Route path='/reset-password' element={<ResetPasswordPage />}></Route>
      <Route path='/home' element={<HomePage />}></Route>
      <Route path='/post' element={<Navigate to='/posts/search' replace />} />
      <Route path='/posts' element={<Navigate to='/posts/search' replace />} />
      <Route path='/posts/create' element={<CreatePostPage />}></Route>
      <Route path='/posts/favourites' element={<FavouritePostsPage />}></Route>
      <Route path='/posts/me' element={<MyPostsPage />}></Route>
      <Route path='/contacts' element={<ContactRequestsPage />}></Route>
      <Route path='/posts/search' element={<SearchResultsPage />}></Route>
      <Route path='/posts/nearby' element={<NearbyPostsPage />}></Route>
      <Route path='/posts/:postId' element={<PostDetailPage />}></Route>
      <Route path='/account/profile' element={<ProfilePage />}></Route>
      <Route path='/account/password' element={<ChangePasswordPage />}></Route>
      <Route path='/account/blocked-users' element={<BlockedUsersPage />}></Route>
      <Route path='/demands' element={<DemandPage />}></Route>
      <Route path='/admin' element={<Navigate to='/admin/overview' replace />} />
      <Route path='/admin/overview' element={<AdminOverviewPage />}></Route>
      <Route path='/admin/posts' element={<AdminPostsPage />}></Route>
      <Route path='/admin/users' element={<AdminUsersPage />}></Route>
      <Route path='/admin/reports' element={<AdminReportsPage />}></Route>
      <Route path='/admin/hosts' element={<AdminHostsPage />}></Route>
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/verify-email' element={<VerifyEmailPage />} />
      <Route path='*' element={<Navigate to='/home' replace />} />
    </Routes>
  )
}

export default AppRoutes
