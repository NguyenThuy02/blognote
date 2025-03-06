import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Products', href: '/products' },
  { name: 'Orders', href: '/orders' },
  { name: 'Customers', href: '/customers' },
  { name: 'Settings', href: '/settings' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-800 text-white p-4">
      <nav className="space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-4 py-2 rounded-md ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {item.name}
            </Link>
          )
        })}
        
        <div className="pt-4 border-t border-gray-700">
          <Link
            href="/auth/login"
            className="block px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700"
          >
            Đăng nhập
          </Link>
          <Link
            href="/auth/register"
            className="block px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700"
          >
            Đăng ký
          </Link>
        </div>
      </nav>
    </div>
  )
}
