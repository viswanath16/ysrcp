'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Loader2,
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface VoterSubmission {
  id: string
  voter_id: string
  phone_number: string
  name: string
  surname?: string
  father_husband_name?: string
  gender?: string
  age?: number
  qualification?: string
  caste?: string
  sub_caste?: string
  pc?: string
  ac?: string
  mandal_ward_division?: string
  panchayat_name?: string
  village_name?: string
  booth?: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  submitted_by?: string
  submitted_at?: string
  created_at: string
  submitter?: {
    full_name?: string
    email: string
  }
}

export default function ApprovalsPage() {
  const [submissions, setSubmissions] = useState<VoterSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<VoterSubmission | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  
  const { profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (profile?.role === 'approver' || profile?.role === 'admin') {
      fetchSubmissions()
    }
  }, [profile, statusFilter])

  const fetchSubmissions = async () => {
    try {
      let query = supabase
        .from('voter_submissions')
        .select(`
          *,
          submitter:submitted_by(full_name, email)
        `)
        .order('submitted_at', { ascending: false })

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

  const handleApproval = async (submissionId: string, action: 'approved' | 'rejected') => {
    if (!profile) return

    setProcessingId(submissionId)
    try {
      const updateData: any = {
        status: action,
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (action === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason
      }

      const { error } = await supabase
        .from('voter_submissions')
        .update(updateData)
        .eq('id', submissionId)

      if (error) throw error

      toast({
        title: 'Success',
        description: `Submission ${action} successfully`,
      })

      // Refresh the list
      fetchSubmissions()
      setSelectedSubmission(null)
      setRejectionReason('')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} submission`,
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
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

  if (profile?.role !== 'approver' && profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
        <p className="text-gray-600">
          Review and approve voter submissions
        </p>
      </div>

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
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
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

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Voter Submissions</CardTitle>
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
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Actions</TableHead>
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
                        {submission.submitter?.full_name || submission.submitter?.email || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {submission.submitted_at 
                          ? new Date(submission.submitted_at).toLocaleDateString()
                          : 'Not submitted'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSubmission(submission)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Voter Details</DialogTitle>
                                <DialogDescription>
                                  Review voter information before approval
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedSubmission && (
                                <div className="grid grid-cols-2 gap-4 py-4">
                                  <div>
                                    <Label className="font-medium">Voter ID</Label>
                                    <p>{selectedSubmission.voter_id}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Phone Number</Label>
                                    <p>{selectedSubmission.phone_number}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Name</Label>
                                    <p>{selectedSubmission.surname ? `${selectedSubmission.surname} ` : ''}{selectedSubmission.name}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Father/Husband Name</Label>
                                    <p>{selectedSubmission.father_husband_name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Gender</Label>
                                    <p>{selectedSubmission.gender || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Age</Label>
                                    <p>{selectedSubmission.age || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Qualification</Label>
                                    <p>{selectedSubmission.qualification || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Caste</Label>
                                    <p>{selectedSubmission.caste || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">PC</Label>
                                    <p>{selectedSubmission.pc || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">AC</Label>
                                    <p>{selectedSubmission.ac || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Village</Label>
                                    <p>{selectedSubmission.village_name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Booth</Label>
                                    <p>{selectedSubmission.booth || 'N/A'}</p>
                                  </div>
                                </div>
                              )}

                              {selectedSubmission?.status === 'pending' && (
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="rejection_reason">Rejection Reason (if rejecting)</Label>
                                    <Textarea
                                      id="rejection_reason"
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      placeholder="Enter reason for rejection..."
                                    />
                                  </div>
                                </div>
                              )}

                              <DialogFooter>
                                {selectedSubmission?.status === 'pending' && (
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => handleApproval(selectedSubmission.id, 'rejected')}
                                      disabled={processingId === selectedSubmission.id}
                                    >
                                      {processingId === selectedSubmission.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <XCircle className="mr-2 h-4 w-4" />
                                      )}
                                      Reject
                                    </Button>
                                    <Button
                                      onClick={() => handleApproval(selectedSubmission.id, 'approved')}
                                      disabled={processingId === selectedSubmission.id}
                                    >
                                      {processingId === selectedSubmission.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                      )}
                                      Approve
                                    </Button>
                                  </div>
                                )}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}