'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  FileSpreadsheet, 
  CheckCircle, 
  BarChart3, 
  LogOut,
  User
} from 'lucide-react'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Fallbacks when profile is not yet available due to RLS/initialization
  const effectiveFullName = profile?.full_name || user.email || 'User'
  const effectiveRole = profile?.role || 'submitter'

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      roles: ['submitter', 'approver', 'admin']
    },
    {
      name: 'Add Voter',
      href: '/dashboard/add-voter',
      icon: User,
      roles: ['submitter', 'admin']
    },
    {
      name: 'Bulk Upload',
      href: '/dashboard/bulk-upload',
      icon: FileSpreadsheet,
      roles: ['submitter', 'admin']
    },
    {
      name: 'Approvals',
      href: '/dashboard/approvals',
      icon: CheckCircle,
      roles: ['approver', 'admin']
    },
    {
      name: 'All Submissions',
      href: '/dashboard/submissions',
      icon: Users,
      roles: ['submitter', 'approver', 'admin']
    },
  ]

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(effectiveRole)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-center h-16 bg-primary text-white">
            <h1 className="text-lg font-bold">YSRCP Portal</h1>
          </div>

          {/* User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                {(profile?.full_name || user.email || 'U').charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                {effectiveFullName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {effectiveRole}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t">
            <Button
              onClick={handleSignOut}
              className="w-full bg-transparent text-gray-800 border border-gray-300 hover:bg-gray-100"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <main className="py-6 px-8">
          {children}
        </main>
      </div>
    </div>
  )
}