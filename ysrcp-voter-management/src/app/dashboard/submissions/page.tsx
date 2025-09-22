'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Search,
  Loader2
} from 'lucide-react'

interface VoterSubmission {
  id: string
  voter_id: string
  phone_number: string
  name: string
  surname?: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  submitted_at?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
}

interface SubmissionBatch {
  id: string
  batch_name: string
  file_name?: string
  total_records: number
  approved_records: number
  rejected_records: number
  pending_records: number
  status: string
  created_at: string
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<VoterSubmission[]>([])
  const [batches, setBatches] = useState<SubmissionBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'pending' | 'approved' | 'rejected'>('all')
  const [activeTab, setActiveTab] = useState<'individual' | 'batches'>('individual')
  
  const { profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      fetchSubmissions()
      fetchBatches()
    }
  }, [profile, statusFilter])

  const fetchSubmissions = async () => {
    if (!profile) return

    try {
      let query = supabase
        .from('voter_submissions')
        .select('*')
        .order('created_at', { ascending: false })

      // Filter by user role
      if (profile.role === 'submitter') {
        query = query.eq('submitted_by', profile.id)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setSubmissions(data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch submissions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBatches = async () => {
    if (!profile) return

    try {
      let query = supabase
        .from('submission_batches')
        .select('*')
        .order('created_at', { ascending: false })

      // Filter by user role
      if (profile.role === 'submitter') {
        query = query.eq('submitted_by', profile.id)
      }

      const { data, error } = await query

      if (error) throw error
      setBatches(data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch batches',
        variant: 'destructive',
      })
    }
  }

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.voter_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.phone_number.includes(searchTerm)
    
    return matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline"><FileText className="w-3 h-3 mr-1" />Draft</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="secondary" className="bg-green-50 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
        <p className="text-gray-600">
          View and manage your voter submissions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'individual' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('individual')}
          className="rounded-md"
        >
          Individual Submissions
        </Button>
        <Button
          variant={activeTab === 'batches' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('batches')}
          className="rounded-md"
        >
          Batch Uploads
        </Button>
      </div>

      {activeTab === 'individual' && (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by Voter ID, Name, or Phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['all', 'draft', 'pending', 'approved', 'rejected'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? 'default' : 'outline'}
                      onClick={() => setStatusFilter(status)}
                      className="capitalize"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Submissions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Individual Submissions</CardTitle>
              <CardDescription>
                {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No submissions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Voter ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Approved</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{submission.voter_id}</TableCell>
                          <TableCell>
                            {submission.surname ? `${submission.surname} ` : ''}{submission.name}
                          </TableCell>
                          <TableCell>{submission.phone_number}</TableCell>
                          <TableCell>{getStatusBadge(submission.status)}</TableCell>
                          <TableCell>
                            {submission.submitted_at 
                              ? new Date(submission.submitted_at).toLocaleDateString()
                              : 'Not submitted'
                            }
                          </TableCell>
                          <TableCell>
                            {submission.approved_at 
                              ? new Date(submission.approved_at).toLocaleDateString()
                              : submission.status === 'rejected' 
                                ? 'Rejected'
                                : 'Pending'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'batches' && (
        <Card>
          <CardHeader>
            <CardTitle>Batch Uploads</CardTitle>
            <CardDescription>
              {batches.length} batch{batches.length !== 1 ? 'es' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No batches found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Name</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Total Records</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead>Rejected</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.batch_name}</TableCell>
                        <TableCell>{batch.file_name || 'N/A'}</TableCell>
                        <TableCell>{batch.total_records}</TableCell>
                        <TableCell className="text-green-600">{batch.approved_records}</TableCell>
                        <TableCell className="text-red-600">{batch.rejected_records}</TableCell>
                        <TableCell className="text-yellow-600">{batch.pending_records}</TableCell>
                        <TableCell>{getStatusBadge(batch.status)}</TableCell>
                        <TableCell>
                          {new Date(batch.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}