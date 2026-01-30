'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@saasfly/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saasfly/ui/card";

import { EmptyPlaceholder } from "~/components/empty-placeholder";
import { DashboardHeader } from "~/components/header";
import { DashboardShell } from "~/components/shell";

interface Project {
  id: string;
  title: string;
  brandKitId: string | null;
  styleKitId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="My Carousels"
        text="Create and manage your LinkedIn carousels"
      >
        <Link href="/create">
          <Button data-testid="new_project_button">
            New Carousel
          </Button>
        </Link>
      </DashboardHeader>
      <div>
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        ) : projects.length > 0 ? (
          <div 
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            data-testid="dashboard_projects"
          >
            {projects.map((project) => (
              <Link key={project.id} href={`/editor/${project.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                    <CardDescription>
                      {project.status === 'DRAFT' && 'Draft'}
                      {project.status === 'PUBLISHED' && 'Published'}
                      {project.status === 'ARCHIVED' && 'Archived'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Last updated: {formatDate(project.updatedAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyPlaceholder data-testid="empty_state">
            <EmptyPlaceholder.Icon name="File" />
            <EmptyPlaceholder.Title>
              No carousels yet
            </EmptyPlaceholder.Title>
            <EmptyPlaceholder.Description>
              Get started by creating your first LinkedIn carousel. It only takes 3 minutes!
            </EmptyPlaceholder.Description>
            <Link href="/create">
              <Button variant="outline">
                Create Your First Carousel
              </Button>
            </Link>
          </EmptyPlaceholder>
        )}
      </div>
    </DashboardShell>
  );
}
