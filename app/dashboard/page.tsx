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

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      memberships: {
        include: {
          org: {
            include: {
              projects: {
                include: {
                  parcel: true,
                  engineeringReqs: true
                },
                orderBy: {
                  createdAt: 'desc'
                }
              }
            }
          }
        }
      }
    }
  })

  if (!user) {
    redirect('/login')
  }

  const projects = user.memberships.flatMap(m => m.org.projects)
  
  // If a project is selected, get its full details
  let selectedProject: any = null
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
