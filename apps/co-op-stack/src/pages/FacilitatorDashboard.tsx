import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { SupabaseMeetingService } from '@/services/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, ExternalLink, Trash2, ArrowLeft, Loader2, AlertCircle, Copy, Check } from 'lucide-react';
import { logProduction } from '@/utils/productionLogger';
import { copyMeetingLink } from '@/utils/clipboard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface MeetingSummary {
  id: string;
  code: string;
  title: string;
  facilitator: string;
  createdAt: string;
  isActive: boolean;
}

export default function FacilitatorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { showToast } = useToast();
  
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [facilitatorName, setFacilitatorName] = useState('');
  const [isNameDialogVisible, setIsNameDialogVisible] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyLink = async (code: string) => {
    await copyMeetingLink(code, 'join');
    setCopiedCode(code);
    showToast({
      type: 'success',
      title: 'Copied!',
      message: 'Invite link copied to clipboard'
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  useEffect(() => {
    loadMeetings();
  }, [user]);

  const loadMeetings = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const fetchedMeetings = await SupabaseMeetingService.getMeetingsByFacilitator(user.id);
      setMeetings(fetchedMeetings);
    } catch (error) {
      logProduction('error', {
        action: 'load_facilitator_meetings',
        error: error instanceof Error ? error.message : String(error)
      });
      showToast({
        type: 'error',
        title: 'Failed to load meetings',
        message: 'Could not fetch your meetings'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!user) {
      setIsNameDialogVisible(true);
    } else {
      await createRoom();
    }
  };

  const createRoom = async () => {
    // Clear previous errors
    setCreateError(null);

    if (!newRoomTitle.trim()) {
      setCreateError('Please enter a meeting title');
      showToast({
        type: 'error',
        title: 'Title Required',
        message: 'Please enter a meeting title'
      });
      return;
    }

    if (newRoomTitle.trim().length < 3) {
      setCreateError('Meeting title must be at least 3 characters');
      showToast({
        type: 'error',
        title: 'Title Too Short',
        message: 'Meeting title must be at least 3 characters'
      });
      return;
    }

    setIsCreating(true);
    try {
      const name = user ? profile?.display_name ?? user?.email : facilitatorName;
      
      if (!name || name.trim().length === 0) {
        setCreateError('Facilitator name is required');
        showToast({
          type: 'error',
          title: 'Name Required',
          message: 'Please provide a facilitator name'
        });
        setIsCreating(false);
        return;
      }

      const created = await SupabaseMeetingService.createMeeting(
        newRoomTitle.trim(),
        name.trim(),
        user?.id
      );

      showToast({
        type: 'success',
        title: 'Room Created!',
        message: `Meeting "${created.title}" created with code ${created.code}`
      });

      setNewRoomTitle('');
      setCreateError(null);
      navigate(`/meeting?mode=host&code=${created.code}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      // Provide more specific error messages
      let userFriendlyMessage = 'Please try again';
      if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        userFriendlyMessage = 'Network error. Please check your connection and try again.';
      } else if (errorMessage.includes('duplicate')) {
        userFriendlyMessage = 'A meeting with this code already exists. Please try again.';
      } else if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
        userFriendlyMessage = 'You don\'t have permission to create meetings. Please sign in or contact support.';
      }

      setCreateError(userFriendlyMessage);
      
      logProduction('error', {
        action: 'create_room_dashboard',
        error: errorMessage
      });
      
      showToast({
        type: 'error',
        title: 'Failed to Create Room',
        message: userFriendlyMessage
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string, meetingTitle: string) => {
    if (!user?.id) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'You must be logged in to delete meetings'
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${meetingTitle}"?`)) {
      return;
    }

    try {
      await SupabaseMeetingService.deleteMeeting(meetingId, user.id);
      showToast({
        type: 'success',
        title: 'Meeting Deleted',
        message: `"${meetingTitle}" has been deleted`
      });
      await loadMeetings();
    } catch (error) {
      logProduction('error', {
        action: 'delete_meeting_dashboard',
        meetingId,
        error: error instanceof Error ? error.message : String(error)
      });
      showToast({
        type: 'error',
        title: 'Failed to delete meeting',
        message: 'Please try again'
      });
    }
  };

  const handleOpenMeeting = (code: string) => {
    navigate(`/meeting?mode=host&code=${code}`);
  };

  // if (!user) {
  //   navigate('/meeting?mode=host');
  //   return null;
  // }

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome, Facilitator
          </h1>
          <p className="text-muted-foreground">
            Manage your meetings and create new discussion rooms
          </p>
        </div>

        {/* Create New Meeting */}
        <Card className="mb-8">
          <AlertDialog open={isNameDialogVisible} onOpenChange={setIsNameDialogVisible}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Enter Your Name</AlertDialogTitle>
                <AlertDialogDescription>
                  Please enter your name to be used as the facilitator for this meeting.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                placeholder="Your name"
                value={facilitatorName}
                onChange={(e) => setFacilitatorName(e.target.value)}
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => createRoom()}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Meeting
            </CardTitle>
            <CardDescription>
              Start a new discussion room with a unique code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Enter meeting title..."
                  value={newRoomTitle}
                  onChange={(e) => {
                    setNewRoomTitle(e.target.value);
                    if (createError) setCreateError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isCreating) {
                      void handleCreateRoom();
                    }
                  }}
                  disabled={isCreating}
                  className={createError ? 'border-destructive focus-visible:ring-destructive' : ''}
                  aria-invalid={!!createError}
                  aria-describedby={createError ? 'create-error' : undefined}
                />
              </div>
              <Button
                onClick={() => void handleCreateRoom()}
                disabled={isCreating || !newRoomTitle.trim()}
                className="min-w-[120px]"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Room
                  </>
                )}
              </Button>
            </div>
            
            {/* Error message display */}
            {createError && (
              <div 
                id="create-error"
                className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}
            
            {/* Creating state overlay */}
            {isCreating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Setting up your meeting room...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Meetings */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Your Meetings
          </h2>
          {meetings.length === 0 ? (
            <EmptyState
              illustration="meetings"
              title="No Meetings Yet"
              description="Create your first meeting room above to get started. Share the code with participants to begin your discussion."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {meetings.map((meeting) => (
                <Card
                  key={meeting.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleOpenMeeting(meeting.code)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">
                          {meeting.title}
                        </CardTitle>
                        <CardDescription className="font-mono text-sm">
                          Code: {meeting.code}
                        </CardDescription>
                      </div>
                      <Badge variant={meeting.isActive ? 'default' : 'secondary'}>
                        {meeting.isActive ? 'Active' : 'Ended'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-4">
                      Created: {new Date(meeting.createdAt).toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenMeeting(meeting.code);
                        }}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleCopyLink(meeting.code);
                        }}
                        title="Copy invite link"
                      >
                        {copiedCode === meeting.code ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteMeeting(meeting.id, meeting.title);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
