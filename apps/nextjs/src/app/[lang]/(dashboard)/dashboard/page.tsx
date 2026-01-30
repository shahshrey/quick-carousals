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
          <Button data-testid="new_project_button" size="lg" className="shadow-sm">
            New Carousel
          </Button>
        </Link>
      </DashboardHeader>
      <div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-full">
                <CardHeader className="pb-3">
                  <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div 
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            data-testid="dashboard_projects"
          >
            {projects.map((project) => (
              <Link key={project.id} href={`/editor/${project.id}`}>
                <Card className="group hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        project.status === 'DRAFT' 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                          : project.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {project.status === 'DRAFT' && 'Draft'}
                        {project.status === 'PUBLISHED' && 'Published'}
                        {project.status === 'ARCHIVED' && 'Archived'}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      Last updated: {formatDate(project.updatedAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyPlaceholder data-testid="empty_state" className="border-2">
            <EmptyPlaceholder.Icon name="Sparkles" />
            <EmptyPlaceholder.Title>
              No carousels yet
            </EmptyPlaceholder.Title>
            <EmptyPlaceholder.Description>
              Get started by creating your first LinkedIn carousel. It only takes 3 minutes!
            </EmptyPlaceholder.Description>
            <Link href="/create">
              <Button size="lg" className="mt-2">
                Create Your First Carousel
              </Button>
            </Link>
          </EmptyPlaceholder>
        )}
      </div>
    </DashboardShell>
  );
}
