import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import { ProjectsDashboard } from "@/components/ProjectsDashboard"

const prisma = new PrismaClient()

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ project?: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const params = await searchParams
  const selectedProjectId = params.project

  // Fetch orgs and projects directly since memberships/orgs is not in user model
  const orgs = await prisma.org.findMany({
    where: {
      memberships: {
        some: { userId: session.user.id }
      }
    },
    include: {
      projects: {
        orderBy: { createdAt: 'desc' },
        include: {
          parcel: true,
          engineeringReqs: true,
          tasks: true,
          notes: true
        }
      }
    }
  })

  const projects = orgs.length > 0 ? orgs[0].projects : []
  
  // If a project is selected, get its full details
  let selectedProject = null
  if (selectedProjectId) {
    selectedProject = projects.find((p: any) => p.id === selectedProjectId) || null
  }

  return (
    <ProjectsDashboard 
      projects={projects}
      selectedProject={selectedProject}
      userEmail={session.user.email!}
    />
  )
}