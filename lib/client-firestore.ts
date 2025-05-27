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
import {ChatMessage, ChatThread} from "@/lib/freelancer-firestore";

export interface ClientJob {
  id?: string
  client: string // Changed from clientId to client
  title: string
  description: string
  fixedPrice?: number // Added for fixed price jobs
  hourlyRate?: number // Added for hourly jobs
  paymentType: "hourly" | "fixed" // Added payment type
  skills: string[]
  status?: "open" | "closed" | "in-progress" | "completed" // Made optional
  createdAt: Date
  deadline?: Date
  experienceLevel?: "entry" | "intermediate" | "expert" // Made optional
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
  username: string // Changed from name to username
  email: string
  role: "freelancer"
  overview?: string
  skills?: string[]
  resume_url?: string // Changed from resumeUrl
  resume_name?: string // Added
  resume_fileKey?: string // Added
  employment_history?: EmploymentEntry[]
  createdAt: Date
}

export interface ClientProfile {
  uid: string
  username: string // Changed from name to username
  email: string
  role: "client"
  company_name?: string // Changed from companyName
  location?: string
  createdAt: Date
}

export interface EmploymentEntry {
  company: string
  position: string
  startDate: string // Changed to string
  endDate?: string // Changed to string, can be "Present"
  description: string
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

  if (!clientId) {
    throw new Error("Client ID is required")
  }

  try {
    const q = query(collection(db, "jobs"), where("client", "==", clientId)) // Changed from clientId to client

    const querySnapshot = await getDocs(q)
    const jobs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      deadline: doc.data().deadline?.toDate() || undefined,
    })) as ClientJob[]

    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    console.error("Error in getClientJobs:", error)
    return []
  }
}

export async function updateJob(jobId: string, updates: Partial<ClientJob>) {
  checkFirestore()
  const jobRef = doc(db, "jobs", jobId)
  const updateData = { ...updates }

  if (updates.deadline) {
    updateData.deadline = updates.deadline
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

  if (!clientId) {
    throw new Error("Client ID is required")
  }

  try {
    // Get jobs
    const jobs = await getClientJobs(clientId)
    const totalJobs = jobs.length
    const activeJobs = jobs.filter((job) => job.status === "open").length

    // Get all proposals for client's jobs
    let totalProposals = 0
    let pendingProposals = 0

    for (const job of jobs) {
      if (job.id) {
        try {
          const proposals = await getJobProposals(job.id)
          totalProposals += proposals.length
          pendingProposals += proposals.filter((p) => p.status === "pending").length
        } catch (error) {
          console.error(`Error loading proposals for job ${job.id}:`, error)
          // Continue with other jobs even if one fails
        }
      }
    }

    // Get contracts
    let ongoingContracts = 0
    try {
      const contracts = await getClientContracts(clientId)
      ongoingContracts = contracts.filter((c) => c.status === "ongoing").length
    } catch (error) {
      console.error("Error loading contracts:", error)
      // Continue with default value
    }

    return {
      totalJobs,
      activeJobs,
      pendingProposals,
      ongoingContracts,
      recentActivity: [], // TODO: Implement recent activity
    }
  } catch (error) {
    console.error("Error in getClientDashboardStats:", error)
    // Return default stats if there's an error
    return {
      totalJobs: 0,
      activeJobs: 0,
      pendingProposals: 0,
      ongoingContracts: 0,
      recentActivity: [],
    }
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

// Chat Management - Fixed to avoid composite index requirement
export async function getAllUsers(currentUserId: string): Promise<(FreelancerProfile | ClientProfile)[]> {
  checkFirestore()
  const q = query(collection(db, "users"))

  const querySnapshot = await getDocs(q)
  const users = querySnapshot.docs
      .filter((doc) => doc.id !== currentUserId) // Exclude current user
      .map((doc) => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        employment_history: doc.data().employment_history || [],
      })) as (FreelancerProfile | ClientProfile)[]

  return users
}

// Add function to create or get chat thread
export async function createOrGetChatThread(user1Id: string, user2Id: string): Promise<string> {
  checkFirestore()

  // Create consistent chat ID
  const chatId = [user1Id, user2Id].sort().join("_")

  const chatRef = doc(db, "chats", chatId)
  const chatDoc = await getDoc(chatRef)

  if (!chatDoc.exists()) {
    // Create new chat thread
    await setDoc(chatRef, {
      participants: [user1Id, user2Id],
      lastMessage: "",
      lastMessageTime: Timestamp.now(),
      createdAt: Timestamp.now(),
    })
  }

  return chatId
}

// Update getClientChatThreads function
export async function getChatThreads(userId: string): Promise<ChatThread[]> {
  checkFirestore()

  // Get all chat documents where the user is a participant
  const q = query(collection(db, "chats"), where("participants", "array-contains", userId))

  const querySnapshot = await getDocs(q)
  const threads = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    lastMessageTime: doc.data().lastMessageTime?.toDate() || new Date(),
  })) as ChatThread[]

  return threads.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime())
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  checkFirestore()
  const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate(),
  })) as ChatMessage[]
}

export async function sendMessage(chatId: string, message: {
  chatId: string;
  senderId: string;
  senderName: any;
  message: string;
  read: boolean
}) {
  checkFirestore()
  const messageData = {
    ...message,
    timestamp: Timestamp.now(),
  }

  await addDoc(collection(db, "chats", chatId, "messages"), messageData)

  // Update chat thread
  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: message.message,
    lastMessageTime: Timestamp.now(),
  })
}
