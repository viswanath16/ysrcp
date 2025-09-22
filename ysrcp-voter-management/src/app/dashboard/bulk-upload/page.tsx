'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'
import { 
  Upload, 
  FileSpreadsheet, 
  Check, 
  X, 
  AlertCircle, 
  Download,
  Loader2
} from 'lucide-react'

interface ParsedVoter {
  [key: string]: any
  voter_id: string
  phone_number: string
  name: string
  errors?: string[]
}

interface ValidationError {
  row: number
  field: string
  message: string
}

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedVoter[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [batchName, setBatchName] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Expected column headers
  const expectedHeaders = [
    'Surname', 'Name', 'Father/Husband Name', 'Gender', 'Age', 'Qualification',
    'Caste', 'Sub-Caste', 'PC', 'AC', 'Mandal/Ward/Division', 'Panchayat Name',
    'Village Name', 'Booth', 'VoterID', 'PhoneNumber-10digit'
  ]

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setBatchName(selectedFile.name.replace(/\.[^/.]+$/, "")) // Remove extension
      parseExcelFile(selectedFile)
    }
  }

  const parseExcelFile = async (file: File) => {
    setIsProcessing(true)
    setParsedData([])
    setValidationErrors([])

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

      if (jsonData.length < 2) {
        throw new Error('File must contain at least a header row and one data row')
      }

      const headers = jsonData[0] as string[]
      const dataRows = jsonData.slice(1)

      // Validate headers
      const missingHeaders = expectedHeaders.filter(header => !headers.includes(header))
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`)
      }

      // Parse and validate data
      const parsed: ParsedVoter[] = []
      const errors: ValidationError[] = []

      dataRows.forEach((row, index) => {
        const rowNumber = index + 2 // +2 because of 0-indexing and header row
        const voter: any = {}

        headers.forEach((header, headerIndex) => {
          const value = row[headerIndex]
          
          // Map headers to database field names
          switch (header) {
            case 'Surname':
              voter.surname = value || ''
              break
            case 'Name':
              voter.name = value || ''
              break
            case 'Father/Husband Name':
              voter.father_husband_name = value || ''
              break
            case 'Gender':
              voter.gender = value || ''
              break
            case 'Age':
              voter.age = value ? parseInt(value.toString()) : null
              break
            case 'Qualification':
              voter.qualification = value || ''
              break
            case 'Caste':
              voter.caste = value || ''
              break
            case 'Sub-Caste':
              voter.sub_caste = value || ''
              break
            case 'PC':
              voter.pc = value || ''
              break
            case 'AC':
              voter.ac = value || ''
              break
            case 'Mandal/Ward/Division':
              voter.mandal_ward_division = value || ''
              break
            case 'Panchayat Name':
              voter.panchayat_name = value || ''
              break
            case 'Village Name':
              voter.village_name = value || ''
              break
            case 'Booth':
              voter.booth = value || ''
              break
            case 'VoterID':
              voter.voter_id = value || ''
              break
            case 'PhoneNumber-10digit':
              voter.phone_number = value ? value.toString().replace(/\D/g, '') : ''
              break
          }
        })

        // Validate required fields
        if (!voter.voter_id) {
          errors.push({ row: rowNumber, field: 'VoterID', message: 'Voter ID is required' })
        }
        
        if (!voter.phone_number) {
          errors.push({ row: rowNumber, field: 'PhoneNumber', message: 'Phone number is required' })
        } else if (!/^\d{10}$/.test(voter.phone_number)) {
          errors.push({ row: rowNumber, field: 'PhoneNumber', message: 'Phone number must be exactly 10 digits' })
        }
        
        if (!voter.name) {
          errors.push({ row: rowNumber, field: 'Name', message: 'Name is required' })
        }
        
        if (voter.gender && !['Male', 'Female', 'Other'].includes(voter.gender)) {
          errors.push({ row: rowNumber, field: 'Gender', message: 'Gender must be Male, Female, or Other' })
        }
        
        if (voter.age && (voter.age < 18 || voter.age > 120)) {
          errors.push({ row: rowNumber, field: 'Age', message: 'Age must be between 18 and 120' })
        }

        voter.rowNumber = rowNumber
        parsed.push(voter)
      })

      setParsedData(parsed)
      setValidationErrors(errors)

      toast({
        title: 'File Parsed',
        description: `Parsed ${parsed.length} records with ${errors.length} validation errors`,
      })

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to parse Excel file',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkUpload = async (action: 'draft' | 'submit') => {
    if (!profile || parsedData.length === 0) return

    // Filter out records with errors for submission
    const validRecords = validationErrors.length > 0 && action === 'submit'
      ? parsedData.filter(record => 
          !validationErrors.some(error => error.row === record.rowNumber)
        )
      : parsedData

    if (validRecords.length === 0) {
      toast({
        title: 'No Valid Records',
        description: 'Please fix validation errors before submitting',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Create batch record
      const { data: batch, error: batchError } = await supabase
        .from('submission_batches')
        .insert([{
          batch_name: batchName,
          file_name: file?.name,
          total_records: validRecords.length,
          status: action === 'draft' ? 'draft' : 'submitted',
          submitted_by: profile.id,
        }])
        .select()
        .single()

      if (batchError) throw batchError

      // Check for duplicates
      const duplicates = []
      for (let i = 0; i < validRecords.length; i++) {
        const record = validRecords[i]
        const { data: existing } = await supabase
          .from('voter_submissions')
          .select('id')
          .eq('voter_id', record.voter_id)
          .eq('phone_number', record.phone_number)
          .single()

        if (existing) {
          duplicates.push(record.rowNumber)
        }
      }

      if (duplicates.length > 0) {
        toast({
          title: 'Duplicate Records Found',
          description: `Found ${duplicates.length} duplicate records. Skipping duplicates.`,
          variant: 'destructive',
        })
      }

      // Filter out duplicates
      const uniqueRecords = validRecords.filter(record => 
        !duplicates.includes(record.rowNumber)
      )

      // Insert records in batches of 100
      const batchSize = 100
      let inserted = 0

      for (let i = 0; i < uniqueRecords.length; i += batchSize) {
        const batchRecords = uniqueRecords.slice(i, i + batchSize)
        
        const insertData = batchRecords.map(record => ({
          voter_id: record.voter_id,
          phone_number: record.phone_number,
          surname: record.surname || null,
          name: record.name,
          father_husband_name: record.father_husband_name || null,
          gender: record.gender || null,
          age: record.age || null,
          qualification: record.qualification || null,
          caste: record.caste || null,
          sub_caste: record.sub_caste || null,
          pc: record.pc || null,
          ac: record.ac || null,
          mandal_ward_division: record.mandal_ward_division || null,
          panchayat_name: record.panchayat_name || null,
          village_name: record.village_name || null,
          booth: record.booth || null,
          batch_id: batch.id,
          status: action === 'draft' ? 'draft' : 'pending',
          submitted_by: profile.id,
          submitted_at: action === 'submit' ? new Date().toISOString() : null,
        }))

        const { error } = await supabase
          .from('voter_submissions')
          .insert(insertData)

        if (error) throw error

        inserted += batchRecords.length
        setUploadProgress((inserted / uniqueRecords.length) * 100)
      }

      toast({
        title: 'Success',
        description: `Successfully uploaded ${inserted} records out of ${validRecords.length}`,
      })

      // Reset form
      setFile(null)
      setParsedData([])
      setValidationErrors([])
      setBatchName('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Redirect to submissions
      router.push('/dashboard/submissions')

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload records',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const downloadTemplate = () => {
    const templateData = [expectedHeaders]
    const worksheet = XLSX.utils.aoa_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Voter Template')
    XLSX.writeFile(workbook, 'voter_upload_template.xlsx')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Upload</h1>
          <p className="text-gray-600">
            Upload an Excel file with multiple voter records
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Excel File</CardTitle>
          <CardDescription>
            Select an Excel file (.xlsx, .xls) with voter data. Make sure your file matches the template format.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch_name">Batch Name</Label>
              <Input
                id="batch_name"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Enter a name for this batch"
                disabled={isProcessing || isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Excel File</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx,.xls"
                disabled={isProcessing || isUploading}
              />
            </div>

            {file && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FileSpreadsheet className="h-4 w-4" />
                <span>{file.name}</span>
                <span>({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing file...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>
                  Showing {parsedData.length} records with {validationErrors.length} validation errors
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                {validationErrors.length === 0 && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                    <Check className="w-3 h-3 mr-1" />
                    All Valid
                  </Badge>
                )}
                {validationErrors.length > 0 && (
                  <Badge variant="destructive">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {validationErrors.length} Errors
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isUploading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Uploading records...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <div className="max-h-96 overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Voter ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 50).map((voter, index) => {
                    const rowErrors = validationErrors.filter(e => e.row === voter.rowNumber)
                    const hasErrors = rowErrors.length > 0
                    
                    return (
                      <TableRow key={index} className={hasErrors ? 'bg-red-50' : ''}>
                        <TableCell>{voter.rowNumber}</TableCell>
                        <TableCell>{voter.voter_id}</TableCell>
                        <TableCell>{voter.name}</TableCell>
                        <TableCell>{voter.phone_number}</TableCell>
                        <TableCell>{voter.gender}</TableCell>
                        <TableCell>{voter.age}</TableCell>
                        <TableCell>
                          {hasErrors ? (
                            <div className="flex items-center space-x-1">
                              <X className="w-4 h-4 text-red-500" />
                              <span className="text-xs text-red-600">
                                {rowErrors.length} error{rowErrors.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-xs text-green-600">Valid</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {parsedData.length > 50 && (
              <p className="text-sm text-gray-500 mt-2">
                Showing first 50 records. Total: {parsedData.length}
              </p>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
                <div className="max-h-32 overflow-auto">
                  {validationErrors.slice(0, 20).map((error, index) => (
                    <p key={index} className="text-sm text-red-700">
                      Row {error.row}: {error.field} - {error.message}
                    </p>
                  ))}
                </div>
                {validationErrors.length > 20 && (
                  <p className="text-sm text-red-600 mt-2">
                    ... and {validationErrors.length - 20} more errors
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null)
                  setParsedData([])
                  setValidationErrors([])
                  setBatchName('')
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                disabled={isUploading}
              >
                Clear
              </Button>
              
              <Button
                variant="secondary"
                onClick={() => handleBulkUpload('draft')}
                disabled={isUploading || !batchName}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Save as Draft
              </Button>

              <Button
                onClick={() => handleBulkUpload('submit')}
                disabled={isUploading || !batchName || validationErrors.length > 0}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Submit for Approval
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}