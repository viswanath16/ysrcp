'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Loader2, Save, Send } from 'lucide-react'

const voterSchema = z.object({
  voter_id: z.string().min(1, 'Voter ID is required'),
  phone_number: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  surname: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  father_husband_name: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']),
  age: z.number().min(18, 'Age must be at least 18').max(120, 'Age must be less than 120'),
  qualification: z.string().optional(),
  caste: z.string().optional(),
  sub_caste: z.string().optional(),
  pc: z.string().optional(),
  ac: z.string().optional(),
  mandal_ward_division: z.string().optional(),
  panchayat_name: z.string().optional(),
  village_name: z.string().optional(),
  booth: z.string().optional(),
})

type VoterForm = z.infer<typeof voterSchema>

export default function AddVoterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<VoterForm>({
    resolver: zodResolver(voterSchema),
    defaultValues: {
      voter_id: '',
      phone_number: '',
      surname: '',
      name: '',
      father_husband_name: '',
      qualification: '',
      caste: '',
      sub_caste: '',
      pc: '',
      ac: '',
      mandal_ward_division: '',
      panchayat_name: '',
      village_name: '',
      booth: '',
    },
  })

  const onSubmit = async (data: VoterForm, action: 'draft' | 'submit') => {
    if (!profile) {
      toast({
        title: 'Error',
        description: 'You must be logged in to submit voter data',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      // Check for existing voter with same voter_id and phone_number
      const { data: existingVoter, error: checkError } = await supabase
        .from('voter_submissions')
        .select('id')
        .eq('voter_id', data.voter_id)
        .eq('phone_number', data.phone_number)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingVoter) {
        toast({
          title: 'Duplicate Record',
          description: 'A voter with this Voter ID and Phone Number already exists',
          variant: 'destructive',
        })
        return
      }

      const submissionData = {
        ...data,
        submitted_by: profile.id,
        status: action === 'draft' ? 'draft' : 'pending',
        submitted_at: action === 'submit' ? new Date().toISOString() : null,
      }

      const { error } = await (supabase as any)
        .from('voter_submissions')
        .insert(submissionData)

      if (error) throw error

      toast({
        title: 'Success',
        description: action === 'draft' 
          ? 'Voter record saved as draft' 
          : 'Voter record submitted for approval',
      })

      // Reset form
      form.reset()

      // Redirect to submissions page
      router.push('/dashboard/submissions')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save voter record',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Voter</h1>
        <p className="text-gray-600">
          Fill in the voter information below. You can save as draft or submit for approval.
        </p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Voter Information</CardTitle>
          <CardDescription>
            Please fill in all the required fields marked with *
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voter_id">Voter ID *</Label>
                  <Input
                    id="voter_id"
                    {...form.register('voter_id')}
                    placeholder="Enter voter ID"
                    disabled={isLoading}
                  />
                  {form.formState.errors.voter_id && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.voter_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    {...form.register('phone_number')}
                    placeholder="10-digit phone number"
                    disabled={isLoading}
                  />
                  {form.formState.errors.phone_number && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.phone_number.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="Enter full name"
                    disabled={isLoading}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="surname">Surname</Label>
                  <Input
                    id="surname"
                    {...form.register('surname')}
                    placeholder="Enter surname"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="father_husband_name">Father/Husband Name</Label>
                  <Input
                    id="father_husband_name"
                    {...form.register('father_husband_name')}
                    placeholder="Enter father/husband name"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    onValueChange={(value: 'Male' | 'Female' | 'Other') => form.setValue('gender', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.gender && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.gender.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    {...form.register('age', { valueAsNumber: true })}
                    placeholder="Enter age"
                    disabled={isLoading}
                  />
                  {form.formState.errors.age && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.age.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    {...form.register('qualification')}
                    placeholder="Enter qualification"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caste">Caste</Label>
                  <Input
                    id="caste"
                    {...form.register('caste')}
                    placeholder="Enter caste"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sub_caste">Sub-Caste</Label>
                  <Input
                    id="sub_caste"
                    {...form.register('sub_caste')}
                    placeholder="Enter sub-caste"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pc">PC (Parliamentary Constituency)</Label>
                  <Input
                    id="pc"
                    {...form.register('pc')}
                    placeholder="Enter PC"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ac">AC (Assembly Constituency)</Label>
                  <Input
                    id="ac"
                    {...form.register('ac')}
                    placeholder="Enter AC"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mandal_ward_division">Mandal/Ward/Division</Label>
                  <Input
                    id="mandal_ward_division"
                    {...form.register('mandal_ward_division')}
                    placeholder="Enter mandal/ward/division"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panchayat_name">Panchayat Name</Label>
                  <Input
                    id="panchayat_name"
                    {...form.register('panchayat_name')}
                    placeholder="Enter panchayat name"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="village_name">Village Name</Label>
                  <Input
                    id="village_name"
                    {...form.register('village_name')}
                    placeholder="Enter village name"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="booth">Booth</Label>
                  <Input
                    id="booth"
                    {...form.register('booth')}
                    placeholder="Enter booth number"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                className="bg-transparent text-gray-800 border border-gray-300 hover:bg-gray-100"
                onClick={() => router.push('/dashboard')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              
              <Button
                type="button"
                className="bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200"
                onClick={form.handleSubmit((data) => onSubmit(data, 'draft'))}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save as Draft
              </Button>

              <Button
                type="button"
                onClick={form.handleSubmit((data) => onSubmit(data, 'submit'))}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit for Approval
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}