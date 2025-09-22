'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Users, 
  FileSpreadsheet, 
  CheckCircle, 
  Clock,
  XCircle,
  TrendingUp
} from 'lucide-react'

interface DashboardStats {
  totalSubmissions: number
  pendingApprovals: number
  approvedRecords: number
  rejectedRecords: number
  mySubmissions: number
  myBatches: number
}

export default function DashboardPage() {
  const { profile, user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalSubmissions: 0,
    pendingApprovals: 0,
    approvedRecords: 0,
    rejectedRecords: 0,
    mySubmissions: 0,
    myBatches: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [profile, user])

  const fetchDashboardStats = async () => {
    const submitterId = profile?.id || user?.id
    if (!submitterId) return

    try {
      // Get total submissions count
      const { count: totalSubmissions } = await supabase
        .from('voter_submissions')
        .select('*', { count: 'exact', head: true })

      // Get pending approvals count
      const { count: pendingApprovals } = await supabase
        .from('voter_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Get approved records count
      const { count: approvedRecords } = await supabase
        .from('voter_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')

      // Get rejected records count
      const { count: rejectedRecords } = await supabase
        .from('voter_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')

      // Get user's submissions count
      const { count: mySubmissions } = await supabase
        .from('voter_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('submitted_by', submitterId)

      // Get user's batches count
      const { count: myBatches } = await supabase
        .from('submission_batches')
        .select('*', { count: 'exact', head: true })
        .eq('submitted_by', submitterId)

      setStats({
        totalSubmissions: totalSubmissions || 0,
        pendingApprovals: pendingApprovals || 0,
        approvedRecords: approvedRecords || 0,
        rejectedRecords: rejectedRecords || 0,
        mySubmissions: mySubmissions || 0,
        myBatches: myBatches || 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    color = "default" 
  }: {
    title: string
    value: number
    description: string
    icon: any
    color?: "default" | "success" | "warning" | "danger"
  }) => {
    const colorClasses = {
      default: "text-blue-600 bg-blue-50",
      success: "text-green-600 bg-green-50",
      warning: "text-yellow-600 bg-yellow-50",
      danger: "text-red-600 bg-red-50",
    }

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900">{title}</CardTitle>
          <div className={`p-2 rounded-md ${colorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? '...' : value.toLocaleString()}
          </div>
          <p className="text-xs text-gray-700">{description}</p>
        </CardContent>
      </Card>
    )
  }

  const getStatsForRole = () => {
    const commonStats = [
      {
        title: "Total Submissions",
        value: stats.totalSubmissions,
        description: "All voter records in system",
        icon: Users,
        color: "default" as const
      },
      {
        title: "Approved Records",
        value: stats.approvedRecords,
        description: "Successfully approved voters",
        icon: CheckCircle,
        color: "success" as const
      }
    ]

    switch (profile?.role || 'submitter') {
      case 'submitter':
        return [
          {
            title: "My Submissions",
            value: stats.mySubmissions,
            description: "Records I've submitted",
            icon: FileSpreadsheet,
            color: "default" as const
          },
          {
            title: "My Batches",
            value: stats.myBatches,
            description: "Excel uploads I've created",
            icon: TrendingUp,
            color: "default" as const
          },
          ...commonStats
        ]

      case 'approver':
        return [
          {
            title: "Pending Approvals",
            value: stats.pendingApprovals,
            description: "Records awaiting review",
            icon: Clock,
            color: "warning" as const
          },
          {
            title: "Rejected Records",
            value: stats.rejectedRecords,
            description: "Records that need attention",
            icon: XCircle,
            color: "danger" as const
          },
          ...commonStats
        ]

      case 'admin':
        return [
          {
            title: "Pending Approvals",
            value: stats.pendingApprovals,
            description: "Records awaiting review",
            icon: Clock,
            color: "warning" as const
          },
          {
            title: "Rejected Records",
            value: stats.rejectedRecords,
            description: "Records that were rejected",
            icon: XCircle,
            color: "danger" as const
          },
          ...commonStats
        ]

      default:
        return commonStats
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.full_name || 'User'}
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your voter management system today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {getStatsForRole().map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for your role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile?.role === 'submitter' || profile?.role === 'admin' ? (
              <>
                <a 
                  href="/dashboard/add-voter" 
                  className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <Users className="h-5 w-5 mr-3 text-blue-600" />
                  <div>
                    <p className="font-medium">Add New Voter</p>
                    <p className="text-sm text-gray-600">Submit individual voter record</p>
                  </div>
                </a>
                <a 
                  href="/dashboard/bulk-upload" 
                  className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <FileSpreadsheet className="h-5 w-5 mr-3 text-green-600" />
                  <div>
                    <p className="font-medium">Bulk Upload</p>
                    <p className="text-sm text-gray-600">Upload Excel file with multiple records</p>
                  </div>
                </a>
              </>
            ) : null}
            
            {profile?.role === 'approver' || profile?.role === 'admin' ? (
              <a 
                href="/dashboard/approvals" 
                className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <CheckCircle className="h-5 w-5 mr-3 text-orange-600" />
                <div>
                  <p className="font-medium">Review Submissions</p>
                  <p className="text-sm text-gray-600">Approve or reject pending records</p>
                </div>
              </a>
            ) : null}
            
            <a 
              href="/dashboard/submissions" 
              className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="h-5 w-5 mr-3 text-purple-600" />
              <div>
                <p className="font-medium">View All Submissions</p>
                <p className="text-sm text-gray-600">Browse and search all records</p>
              </div>
            </a>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>
              Current system status and metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">Processing Status</span>
              <span className="text-sm text-green-600">● Online</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-800">
                <span>Approval Rate</span>
                <span className="font-medium">
                  {stats.totalSubmissions > 0 
                    ? Math.round((stats.approvedRecords / stats.totalSubmissions) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${stats.totalSubmissions > 0 
                      ? (stats.approvedRecords / stats.totalSubmissions) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-800">
                <span>Pending Review</span>
                <span className="font-medium">
                  {stats.totalSubmissions > 0 
                    ? Math.round((stats.pendingApprovals / stats.totalSubmissions) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ 
                    width: `${stats.totalSubmissions > 0 
                      ? (stats.pendingApprovals / stats.totalSubmissions) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}