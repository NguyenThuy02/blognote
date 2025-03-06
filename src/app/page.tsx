import { redirect } from 'next/navigation'

export default function Home() {
  // Kiểm tra trạng thái đăng nhập ở đây
  const isLoggedIn = false // Thay bằng logic kiểm tra đăng nhập thực tế

  if (!isLoggedIn) {
    redirect('/auth/login')
  }
  
  redirect('/dashboard')
} 