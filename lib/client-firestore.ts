import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

export interface ClientJob {
  id?: string
  clientId: string
  title: string
  description: string
  budget: number
  skills: string[]
  status: "open" | "closed" | "in-progress" | "completed"
  createdAt: Date
  deadline?: Date
  experienceLevel: "entry" | "intermediate" | "expert"
  location?: string
}

export interface JobProposal {
  id?: string
  jobId: string
  freelancerId: string
  freelancerName: string
  freelancerEmail: string
  proposalText: string
  coverLetter: string
  bidAmount: number
  status: "pending" | "viewed" | "accepted" | "rejected"
  createdAt: Date
}

export interface ClientContract {
  id?: string
  jobId: string
  freelancerId: string
  clientId: string
  jobTitle: string
  freelancerName: string
  status: "ongoing" | "completed" | "cancelled"
  startDate: Date
  endDate?: Date
  amount: number
}

export interface FreelancerProfile {
  uid: string
  name: string
  email: string
  role: "freelancer"
  overview?: string
  skills?: string[]
  resumeUrl?: string
  employment_history?: EmploymentEntry[]
  createdAt: Date
}

export interface EmploymentEntry {
  company: string
  position: string
  startDate: Date
  endDate?: Date
  description: string
  current: boolean
}

export interface ClientFile {
  id?: string
  fileName: string
  downloadURL: string
  uploadedAt: Date
  fileType: string
  size: number
}

// Check if Firestore is available
const checkFirestore = () => {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.")
  }
}

// Jobs Management
export async function createJob(job: Omit<ClientJob, "id" | "createdAt">) {
  checkFirestore()
  const jobData = {
    ...job,
    createdAt: Timestamp.now(),
    deadline: job.deadline ? Timestamp.fromDate(job.deadline) : null,
  }

  const jobRef = collection(db, "jobs")
  const docRef = await addDoc(jobRef, jobData)
  return docRef.id
}

export async function getClientJobs(clientId: string): Promise<ClientJob[]> {
  checkFirestore()
  const q = query(collection(db, "jobs"), where("clientId", "==", clientId), orderBy("createdAt", "desc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    deadline: doc.data().deadline?.toDate() || undefined,
  })) as ClientJob[]
}

export async function updateJob(jobId: string, updates: Partial<ClientJob>) {
  checkFirestore()
  const jobRef = doc(db, "jobs", jobId)
  const updateData = { ...updates }

  if (updates.deadline) {
    updateData.deadline = Timestamp.fromDate(updates.deadline)
  }

  await updateDoc(jobRef, updateData)
}

export async function deleteJob(jobId: string) {
  checkFirestore()
  const jobRef = doc(db, "jobs", jobId)
  await deleteDoc(jobRef)
}

// Proposals Management
export async function getJobProposals(jobId: string): Promise<JobProposal[]> {
  checkFirestore()
  const q = query(collection(db, "jobs", jobId, "proposals"), orderBy("createdAt", "desc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
  })) as JobProposal[]
}

export async function updateProposalStatus(jobId: string, proposalId: string, status: string) {
  checkFirestore()
  const proposalRef = doc(db, "jobs", jobId, "proposals", proposalId)
  await updateDoc(proposalRef, { status })

  // Also update in freelancer's proposals
  const proposal = await getDoc(proposalRef)
  if (proposal.exists()) {
    const freelancerId = proposal.data().freelancerId
    const freelancerProposalRef = doc(db, "users", freelancerId, "proposals", proposalId)
    await updateDoc(freelancerProposalRef, { status })
  }
}

// Contracts Management
export async function createContract(contract: Omit<ClientContract, "id" | "startDate">) {
  checkFirestore()
  const contractData = {
    ...contract,
    startDate: Timestamp.now(),
  }

  // Create contract in job
  const jobContractRef = collection(db, "jobs", contract.jobId, "contracts")
  const jobContractDoc = await addDoc(jobContractRef, contractData)

  // Create contract in freelancer's profile
  const freelancerContractRef = collection(db, "users", contract.freelancerId, "contracts")
  await setDoc(doc(freelancerContractRef, jobContractDoc.id), contractData)

  // Create contract in client's profile
  const clientContractRef = collection(db, "users", contract.clientId, "contracts")
  await setDoc(doc(clientContractRef, jobContractDoc.id), contractData)

  return jobContractDoc.id
}

export async function getClientContracts(clientId: string): Promise<ClientContract[]> {
  checkFirestore()
  const q = query(collection(db, "users", clientId, "contracts"), orderBy("startDate", "desc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    startDate: doc.data().startDate.toDate(),
    endDate: doc.data().endDate?.toDate() || undefined,
  })) as ClientContract[]
}

// Freelancer Search
export async function searchFreelancers(filters?: {
  skills?: string[]
  location?: string
}): Promise<FreelancerProfile[]> {
  checkFirestore()
  const q = query(collection(db, "users"), where("role", "==", "freelancer"), orderBy("createdAt", "desc"))

  const querySnapshot = await getDocs(q)
  let freelancers = querySnapshot.docs.map((doc) => ({
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    employment_history:
      doc.data().employment_history?.map((entry: any) => ({
        ...entry,
        startDate: entry.startDate.toDate(),
        endDate: entry.endDate?.toDate() || undefined,
      })) || [],
  })) as FreelancerProfile[]

  // Apply client-side filtering
  if (filters?.skills && filters.skills.length > 0) {
    freelancers = freelancers.filter((freelancer) =>
      freelancer.skills?.some((skill) => filters.skills!.includes(skill)),
    )
  }

  return freelancers
}

export async function getFreelancerProfile(freelancerId: string): Promise<FreelancerProfile | null> {
  checkFirestore()
  const freelancerRef = doc(db, "users", freelancerId)
  const freelancerSnap = await getDoc(freelancerRef)

  if (freelancerSnap.exists()) {
    const data = freelancerSnap.data()
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      employment_history:
        data.employment_history?.map((entry: any) => ({
          ...entry,
          startDate: entry.startDate.toDate(),
          endDate: entry.endDate?.toDate() || undefined,
        })) || [],
    } as FreelancerProfile
  }

  return null
}

// Dashboard Stats
export async function getClientDashboardStats(clientId: string) {
  checkFirestore()

  // Get jobs
  const jobs = await getClientJobs(clientId)
  const totalJobs = jobs.length
  const activeJobs = jobs.filter((job) => job.status === "open").length

  // Get all proposals for client's jobs
  let totalProposals = 0
  let pendingProposals = 0

  for (const job of jobs) {
    if (job.id) {
      const proposals = await getJobProposals(job.id)
      totalProposals += proposals.length
      pendingProposals += proposals.filter((p) => p.status === "pending").length
    }
  }

  // Get contracts
  const contracts = await getClientContracts(clientId)
  const ongoingContracts = contracts.filter((c) => c.status === "ongoing").length

  return {
    totalJobs,
    activeJobs,
    pendingProposals,
    ongoingContracts,
    recentActivity: [], // TODO: Implement recent activity
  }
}

// Files Management
export async function saveClientFile(userId: string, file: Omit<ClientFile, "id" | "uploadedAt">) {
  checkFirestore()
  const fileData = {
    ...file,
    uploadedAt: Timestamp.now(),
  }

  const fileRef = collection(db, "users", userId, "files")
  const docRef = await addDoc(fileRef, fileData)
  return docRef.id
}

export async function getClientFiles(userId: string): Promise<ClientFile[]> {
  checkFirestore()
  const q = query(collection(db, "users", userId, "files"), orderBy("uploadedAt", "desc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    uploadedAt: doc.data().uploadedAt.toDate(),
  })) as ClientFile[]
}

export async function deleteClientFile(userId: string, fileId: string) {
  checkFirestore()
  const fileRef = doc(db, "users", userId, "files", fileId)
  await deleteDoc(fileRef)
}

// Chat Management (reuse from freelancer)
export async function getClientChatThreads(clientId: string) {
  checkFirestore()
  const q = query(collection(db, "chats"), where("clientId", "==", clientId), orderBy("lastMessageTime", "desc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    lastMessageTime: doc.data().lastMessageTime.toDate(),
  }))
}
